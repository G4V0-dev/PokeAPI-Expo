/**
 * Capa de acceso a datos SOLO DynamoDB para docentes.
 * El servidor (server.js) NUNCA importa el SDK de AWS directamente:
 * solo usa la interfaz { health, listTeachers, getTeacher,
 * createTeacher, updateTeacher, patchTeacher, deleteTeacher }.
 *
 * SIN fallback en memoria por decision del proyecto: `teachers.seed.json`
 * es SOLO respaldo semilla para `npm run seed`. Sin acceso a DynamoDB
 * el micro responde 503 (ver server.js), nunca sirve la semilla en vivo.
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

function createDynamoRepository({ docClient, tableName, ScanCommand, GetCommand, PutCommand, DeleteCommand }) {
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

  function slugify(name) {
    return String(name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeAliases(input) {
    if (Array.isArray(input)) return input.map((a) => String(a).toLowerCase().trim()).filter(Boolean);
    if (typeof input === 'string') return input.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
    return [];
  }

  // Acepta body plano { name, profession, ... } o anidado { data: {...} }.
  function flatPayload(payload) {
    const p = payload && typeof payload === 'object' ? payload : {};
    const nested = p.data && typeof p.data === 'object' ? p.data : {};
    const pick = (k) => (p[k] !== undefined ? p[k] : nested[k]);
    return {
      name: pick('name'),
      profession: pick('profession'),
      headline: pick('headline') || '',
      description: pick('description') || '',
      photo: pick('photo') || '',
      profileUrl: pick('profileUrl') || '',
      area: pick('area') || '',
      aliases: p.aliases !== undefined ? p.aliases : nested.aliases,
    };
  }

  // 400 si falta lo obligatorio. PUT exige name+profession; PATCH exige
  // al menos un campo editable y que los presentes no vengan vacios.
  function validateInput(payload, { partial = false } = {}) {
    const f = flatPayload(payload);
    if (!partial) {
      if (!String(f.name || '').trim()) return 'El campo name es obligatorio.';
      if (!String(f.profession || '').trim()) return 'El campo profession es obligatorio.';
      return null;
    }
    const keys = ['name', 'profession', 'headline', 'description', 'photo', 'profileUrl', 'area', 'aliases'];
    const provided = keys.filter((k) => f[k] !== undefined);
    if (provided.length === 0) return 'PATCH sin campos: envia al menos uno editable.';
    if (f.name !== undefined && !String(f.name).trim()) return 'El campo name no puede quedar vacio.';
    if (f.profession !== undefined && !String(f.profession).trim()) return 'El campo profession no puede quedar vacio.';
    return null;
  }

  function buildItem({ id, order, payload }) {
    const f = flatPayload(payload);
    const name = String(f.name).trim();
    return {
      id: Number(id),
      order: Number(order),
      name_lower: name.toLowerCase(),
      aliases: normalizeAliases(f.aliases),
      seed_key: slugify(name),
      data: {
        id: Number(id),
        name,
        profession: String(f.profession || '').trim(),
        headline: String(f.headline || ''),
        description: String(f.description || ''),
        photo: String(f.photo || ''),
        profileUrl: String(f.profileUrl || ''),
        area: String(f.area || ''),
      },
    };
  }

  return {
    mode: 'dynamodb',
    validateInput,
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
          new GetCommand({ TableName: tableName, Key: { id: Number(q) } })
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
    // POST: id = max(id)+1, order = max(order)+1. Exige name+profession.
    async createTeacher(payload) {
      const err = validateInput(payload, { partial: false });
      if (err) {
        const e = new Error(err);
        e.status = 400;
        throw e;
      }
      const items = await scanAll();
      const nextId = items.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0) + 1;
      const nextOrder = items.reduce((m, it) => Math.max(m, Number(it.order) || 0), 0) + 1;
      const item = buildItem({ id: nextId, order: nextOrder, payload });
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      return toDetail(item);
    },
    // PUT: reemplazo total por id numerico. Exige name+profession. 404 si no existe.
    async updateTeacher(id, payload) {
      const err = validateInput(payload, { partial: false });
      if (err) {
        const e = new Error(err);
        e.status = 400;
        throw e;
      }
      const cur = await docClient.send(
        new GetCommand({ TableName: tableName, Key: { id: Number(id) } })
      );
      if (!cur.Item) return null;
      const item = buildItem({ id: Number(id), order: Number(cur.Item.order) || Number(id), payload });
      // Conservar aliases enviados o vacios (PUT reemplaza, no mezcla).
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      return toDetail(item);
    },
    // PATCH: mezcla parcial sobre el item existente. 404 si no existe.
    async patchTeacher(id, payload) {
      const err = validateInput(payload, { partial: true });
      if (err) {
        const e = new Error(err);
        e.status = 400;
        throw e;
      }
      const cur = await docClient.send(
        new GetCommand({ TableName: tableName, Key: { id: Number(id) } })
      );
      if (!cur.Item) return null;
      const prev = cur.Item.data || {};
      const f = flatPayload(payload);
      const mergedFlat = {
        name: f.name !== undefined ? String(f.name).trim() : prev.name,
        profession: f.profession !== undefined ? String(f.profession).trim() : prev.profession,
        headline: f.headline !== undefined ? String(f.headline) : prev.headline || '',
        description: f.description !== undefined ? String(f.description) : prev.description || '',
        photo: f.photo !== undefined ? String(f.photo) : prev.photo || '',
        profileUrl: f.profileUrl !== undefined ? String(f.profileUrl) : prev.profileUrl || '',
        area: f.area !== undefined ? String(f.area) : prev.area || '',
        aliases: f.aliases !== undefined ? f.aliases : cur.Item.aliases || [],
      };
      const item = buildItem({ id: Number(id), order: Number(cur.Item.order) || Number(id), payload: mergedFlat });
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      return toDetail(item);
    },
    // DELETE: borra por id numerico. Devuelve el detalle borrado o null.
    async deleteTeacher(id) {
      const cur = await docClient.send(
        new GetCommand({ TableName: tableName, Key: { id: Number(id) } })
      );
      if (!cur.Item) return null;
      await docClient.send(new DeleteCommand({ TableName: tableName, Key: { id: Number(id) } }));
      return toDetail(cur.Item);
    },
  };
}

module.exports = {
  toSummary,
  toDetail,
  createDynamoRepository,
};
