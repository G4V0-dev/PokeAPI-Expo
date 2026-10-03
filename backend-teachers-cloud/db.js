/**
 * Capa de acceso a datos AGNOSTICA para docentes.
 * El servidor (server.js) NUNCA importa el SDK de AWS directamente:
 * solo usa la interfaz { health, listTeachers, getTeacher }.
 *
 * - Si hay credenciales AWS + tabla configurada -> usa DynamoDB (DocumentClient v3).
 * - Si no (dev sin llaves) -> usa memoria con los mismos 3 docentes del seed.
 * Asi se puede cambiar de motor sin tocar el codigo HTTP ni Swagger.
 */

function toSummary(item) {
  const d = item.data || item;
  return {
    id: Number(item.id ?? d.id),
    name: d.name,
    profession: d.profession,
    headline: d.headline,
    photo: d.photo,
    profileUrl: d.profileUrl,
  };
}

function toDetail(item) {
  const d = item.data || item;
  return {
    id: Number(item.id ?? d.id),
    name: d.name,
    profession: d.profession,
    headline: d.headline,
    description: d.description,
    photo: d.photo,
    profileUrl: d.profileUrl,
    area: d.area || null,
    order: item.order != null ? Number(item.order) : null,
  };
}

function matchesQuery(item, q) {
  const query = String(q || '').toLowerCase().trim();
  if (!query) return true;
  const d = item.data || item;
  const hay = `${d.name || ''} ${d.profession || ''} ${(d.aliases || []).join(' ')}`.toLowerCase();
  if (String(item.name_lower || '').includes(query)) return true;
  if (hay.includes(query)) return true;
  // startsWith primero, luego includes (mismo criterio que anime-cloud)
  return false;
}

function createMemoryRepository(seedItems) {
  const items = [...seedItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  return {
    mode: 'memory',
    async health() {
      return { ok: true, db: true, mode: 'memory', count: items.length };
    },
    async listTeachers(query) {
      const q = String(query || '').toLowerCase().trim();
      const filtered = q
        ? items.filter((it) => matchesQuery(it, q))
        : items;
      // startsWith primero para relevancia
      filtered.sort((a, b) => {
        const an = String(a.name_lower || '').startsWith(q) ? 0 : 1;
        const bn = String(b.name_lower || '').startsWith(q) ? 0 : 1;
        return an - bn;
      });
      return filtered.map(toSummary);
    },
    async getTeacher(query) {
      const q = String(query || '').trim();
      if (!q) return null;
      if (/^\d+$/.test(q)) {
        const found = items.find((it) => Number(it.id) === Number(q));
        return found ? toDetail(found) : null;
      }
      const lower = q.toLowerCase();
      const exact = items.find(
        (it) => it.name_lower === lower || (it.aliases || []).includes(lower)
      );
      if (exact) return toDetail(exact);
      const starts = items.find((it) => String(it.name_lower || '').startsWith(lower));
      if (starts) return toDetail(starts);
      const contains = items.find((it) => matchesQuery(it, lower));
      return contains ? toDetail(contains) : null;
    },
  };
}

function createDynamoRepository({ docClient, tableName, ScanCommand, GetItemCommand }) {
  async function scanAll() {
    const out = [];
    let ExclusiveStartKey;
    do {
      const r = await docClient.send(
        new ScanCommand({ TableName: tableName, ExclusiveStartKey })
      );
      out.push(...(r.Items || []));
      ExclusiveStartKey = r.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return out.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }

  return {
    mode: 'dynamodb',
    async health() {
      const r = await docClient.send(
        new ScanCommand({ TableName: tableName, Limit: 1, Select: 'COUNT' })
      );
      return { ok: true, db: true, mode: 'dynamodb', count: r.Count ?? null };
    },
    async listTeachers(query) {
      const items = await scanAll();
      const q = String(query || '').toLowerCase().trim();
      const filtered = q ? items.filter((it) => matchesQuery(it, q)) : items;
      return filtered.map(toSummary);
    },
    async getTeacher(query) {
      const q = String(query || '').trim();
      if (!q) return null;
      if (/^\d+$/.test(q)) {
        const r = await docClient.send(
          new GetItemCommand({ TableName: tableName, Key: { id: Number(q) } })
        );
        return r.Item ? toDetail(r.Item) : null;
      }
      const items = await scanAll();
      const lower = q.toLowerCase();
      const exact = items.find(
        (it) => it.name_lower === lower || (it.aliases || []).includes(lower)
      );
      if (exact) return toDetail(exact);
      const starts = items.find((it) => String(it.name_lower || '').startsWith(lower));
      if (starts) return toDetail(starts);
      const contains = items.find((it) => matchesQuery(it, lower));
      return contains ? toDetail(contains) : null;
    },
  };
}

module.exports = {
  toSummary,
  toDetail,
  createMemoryRepository,
  createDynamoRepository,
};
