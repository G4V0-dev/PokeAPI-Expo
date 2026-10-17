// Almacén temporal offline (expo-sqlite, SDK 54) con fallback en memoria.
// Tablas:
//   pending_ops    -> cola de escrituras pendientes (CREATE|UPDATE|DELETE)
//   teachers_cache -> espejo local de docentes para operar transparente sin red.
//
// El fallback en memoria existe porque expo-sqlite/web es alpha (requiere
// headers COOP/COEP) y para no romper Expo Go si el nativo no está listo.
// La API es idéntica en ambos modos.
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'teachers-offline.db';
export const OP_CREATE = 'CREATE';
export const OP_UPDATE = 'UPDATE';
export const OP_DELETE = 'DELETE';

let db = null;
let useMemory = false;
let memSeq = 1;
let memOps = [];
let memCache = new Map();
// Flags NUEVO (bajada desde la nube): id -> detected_at. Persisten en SQLite.
let memNew = new Map();

function now() {
  return Date.now();
}

function safeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function rowToOp(row) {
  if (!row) return null;
  return {
    id: row.id,
    op: row.op,
    teacherId: row.teacher_id != null ? Number(row.teacher_id) : null,
    tempId: row.temp_id || null,
    payload: safeParse(row.payload || '{}', {}),
    status: row.status || 'pending',
    attempts: Number(row.attempts || 0),
    lastError: row.last_error || null,
    nextRetryAt: Number(row.next_retry_at || 0),
    createdAt: Number(row.created_at || 0),
  };
}

export async function initOfflineDb() {
  if (db || useMemory) return { ok: true, mode: useMemory ? 'memory' : 'sqlite' };
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS pending_ops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT NOT NULL,
        teacher_id INTEGER,
        temp_id TEXT,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        next_retry_at INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pending_status_time
        ON pending_ops (status, next_retry_at, created_at);
      CREATE TABLE IF NOT EXISTS teachers_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        pending INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cloud_new_flags (
        id TEXT PRIMARY KEY,
        detected_at INTEGER NOT NULL
      );
    `);
    return { ok: true, mode: 'sqlite' };
  } catch (e) {
    // Fallback en memoria: la funcionalidad offline sigue operando en sesión.
    useMemory = true;
    db = null;
    console.warn('[offline] SQLite no disponible, usando memoria:', e?.message || e);
    return { ok: true, mode: 'memory' };
  }
}

function targetKey({ teacherId, tempId }) {
  if (tempId) return `temp:${tempId}`;
  if (teacherId != null) return `id:${Number(teacherId)}`;
  return null;
}

// --- Cola pendiente ---

export async function listPendingOps() {
  if (useMemory) return [...memOps].sort((a, b) => a.createdAt - b.createdAt);
  await initOfflineDb();
  const rows = await db.getAllAsync('SELECT * FROM pending_ops WHERE status = ? ORDER BY created_at ASC', 'pending');
  return rows.map(rowToOp);
}

// Ops listas para procesar (respetan next_retry_at del backoff).
export async function listDueOps(timestamp) {
  const t = timestamp || now();
  const all = await listPendingOps();
  return all.filter((o) => (o.nextRetryAt || 0) <= t);
}

export async function countPending() {
  if (useMemory) return memOps.length;
  await initOfflineDb();
  const row = await db.getFirstAsync('SELECT COUNT(*) AS n FROM pending_ops WHERE status = ?', 'pending');
  return Number(row?.n || 0);
}

export async function listFailedOps() {
  if (useMemory) return [];
  await initOfflineDb();
  const rows = await db.getAllAsync('SELECT * FROM pending_ops WHERE status = ? ORDER BY created_at ASC', 'failed');
  return rows.map(rowToOp);
}

export async function deleteOp(id) {
  if (useMemory) {
    memOps = memOps.filter((o) => o.id !== id);
    return;
  }
  await initOfflineDb();
  await db.runAsync('DELETE FROM pending_ops WHERE id = ?', id);
}

export async function markOpRetry(id, lastError, nextRetryAt) {
  if (useMemory) {
    memOps = memOps.map((o) =>
      o.id === id ? { ...o, attempts: o.attempts + 1, lastError, nextRetryAt } : o
    );
    return;
  }
  await initOfflineDb();
  await db.runAsync(
    'UPDATE pending_ops SET attempts = attempts + 1, last_error = ?, next_retry_at = ? WHERE id = ?',
    String(lastError || '').slice(0, 500),
    Number(nextRetryAt || 0),
    id
  );
}

export async function markOpFailed(id, lastError) {
  if (useMemory) return;
  await initOfflineDb();
  await db.runAsync('UPDATE pending_ops SET status = ?, last_error = ? WHERE id = ?', 'failed', String(lastError || '').slice(0, 500), id);
}

export async function clearFailedOps() {
  if (useMemory) return 0;
  await initOfflineDb();
  const r = await db.runAsync('DELETE FROM pending_ops WHERE status = ?', 'failed');
  return r.changes || 0;
}

// Encola con coalescing para no sincronizar basura:
// - UPDATE sobre temp con CREATE pendiente -> fusiona en el CREATE.
// - DELETE sobre temp con CREATE pendiente -> anula todo (nada que subir).
// - UPDATE+UPDATE mismo ID -> fusiona payloads en una sola op.
// - UPDATE+DELETE mismo ID -> deja solo el DELETE.
// Devuelve { id, annulled } (annulled=true cuando CREATE+DELETE se cancelan).
export async function enqueueOp({ op, teacherId, tempId, payload }) {
  const body = { ...(payload || {}) };
  const key = targetKey({ teacherId, tempId });

  if (useMemory) {
    if (key && op === OP_UPDATE) {
      const createIdx = memOps.findIndex((o) => o.op === OP_CREATE && targetKey(o) === key);
      if (createIdx >= 0) {
        memOps[createIdx] = { ...memOps[createIdx], payload: { ...memOps[createIdx].payload, ...body } };
        return { id: memOps[createIdx].id, annulled: false, merged: true };
      }
      const updIdx = memOps.findIndex((o) => o.op === OP_UPDATE && targetKey(o) === key);
      if (updIdx >= 0) {
        memOps[updIdx] = { ...memOps[updIdx], payload: { ...memOps[updIdx].payload, ...body } };
        return { id: memOps[updIdx].id, annulled: false, merged: true };
      }
    }
    if (key && op === OP_DELETE) {
      const hadCreate = memOps.some((o) => o.op === OP_CREATE && targetKey(o) === key);
      memOps = memOps.filter((o) => targetKey(o) !== key);
      if (hadCreate) {
        memCache.delete(tempId || String(teacherId));
        return { id: null, annulled: true };
      }
    }
    const row = { id: memSeq++, op, teacherId: teacherId != null ? Number(teacherId) : null, tempId: tempId || null, payload: body, status: 'pending', attempts: 0, lastError: null, nextRetryAt: 0, createdAt: now() };
    memOps.push(row);
    return { id: row.id, annulled: false };
  }

  await initOfflineDb();

  if (key && op === OP_UPDATE) {
    const createRow = await db.getFirstAsync(
      "SELECT * FROM pending_ops WHERE status = 'pending' AND op = ? AND ((temp_id IS NOT NULL AND temp_id = ?) OR (temp_id IS NULL AND teacher_id = ?)) ORDER BY created_at ASC",
      OP_CREATE,
      tempId || '__none__',
      teacherId != null ? Number(teacherId) : -1
    );
    if (createRow) {
      const merged = { ...safeParse(createRow.payload || '{}', {}), ...body };
      await db.runAsync('UPDATE pending_ops SET payload = ? WHERE id = ?', JSON.stringify(merged), createRow.id);
      return { id: createRow.id, annulled: false, merged: true };
    }
    const updRow = await db.getFirstAsync(
      "SELECT * FROM pending_ops WHERE status = 'pending' AND op = ? AND ((temp_id IS NOT NULL AND temp_id = ?) OR (temp_id IS NULL AND teacher_id = ?)) ORDER BY created_at ASC",
      OP_UPDATE,
      tempId || '__none__',
      teacherId != null ? Number(teacherId) : -1
    );
    if (updRow) {
      const merged = { ...safeParse(updRow.payload || '{}', {}), ...body };
      await db.runAsync('UPDATE pending_ops SET payload = ? WHERE id = ?', JSON.stringify(merged), updRow.id);
      return { id: updRow.id, annulled: false, merged: true };
    }
  }

  if (key && op === OP_DELETE) {
    const createRow = await db.getFirstAsync(
      "SELECT * FROM pending_ops WHERE status = 'pending' AND op = ? AND ((temp_id IS NOT NULL AND temp_id = ?) OR (temp_id IS NULL AND teacher_id = ?)) LIMIT 1",
      OP_CREATE,
      tempId || '__none__',
      teacherId != null ? Number(teacherId) : -1
    );
    if (tempId || createRow) {
      if (tempId) {
        await db.runAsync("DELETE FROM pending_ops WHERE status = 'pending' AND (temp_id = ?)", tempId);
        await db.runAsync('DELETE FROM teachers_cache WHERE id = ?', String(tempId));
      } else {
        await db.runAsync("DELETE FROM pending_ops WHERE status = 'pending' AND temp_id IS NULL AND teacher_id = ?", Number(teacherId));
      }
      if (createRow) return { id: null, annulled: true };
    } else if (teacherId != null) {
      // UPDATE pendiente + DELETE real -> deja solo el DELETE.
      await db.runAsync("DELETE FROM pending_ops WHERE status = 'pending' AND op = ? AND temp_id IS NULL AND teacher_id = ?", OP_UPDATE, Number(teacherId));
    }
  }

  const res = await db.runAsync(
    'INSERT INTO pending_ops (op, teacher_id, temp_id, payload, status, attempts, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    op,
    teacherId != null ? Number(teacherId) : null,
    tempId || null,
    JSON.stringify(body),
    'pending',
    now()
  );
  return { id: res.lastInsertRowId, annulled: false };
}

// Tras POST exitoso: las ops que apuntaban al temp pasan al ID real.
export async function remapTempId(tempId, realId) {
  if (!tempId || realId == null) return;
  if (useMemory) {
    memOps = memOps.map((o) => (o.tempId === tempId ? { ...o, teacherId: Number(realId), tempId: null } : o));
    const cached = memCache.get(String(tempId));
    if (cached) {
      memCache.delete(String(tempId));
      memCache.set(String(realId), { ...cached, id: String(realId) });
    }
    return;
  }
  await initOfflineDb();
  await db.runAsync('UPDATE pending_ops SET teacher_id = ?, temp_id = NULL WHERE temp_id = ?', Number(realId), String(tempId));
  const cached = await db.getFirstAsync('SELECT * FROM teachers_cache WHERE id = ?', String(tempId));
  if (cached) {
    await db.runAsync('DELETE FROM teachers_cache WHERE id = ?', String(tempId));
    const data = { ...safeParse(cached.data || '{}', {}), id: Number(realId) };
    await db.runAsync(
      'INSERT OR REPLACE INTO teachers_cache (id, data, pending, updated_at) VALUES (?, ?, ?, ?)',
      String(realId),
      JSON.stringify(data),
      1,
      now()
    );
  }
}

// --- Caché local ---

export async function replaceCachedTeachers(list) {
  const arr = Array.isArray(list) ? list : [];
  if (useMemory) {
    memCache = new Map(arr.map((t) => [String(t.id), t]));
    return;
  }
  await initOfflineDb();
  const t = now();
  for (const item of arr) {
    await db.runAsync('INSERT OR REPLACE INTO teachers_cache (id, data, pending, updated_at) VALUES (?, ?, ?, ?)', String(item.id), JSON.stringify(item), 0, t);
  }
}

export async function upsertCachedTeacher(item, pending) {
  if (!item || item.id == null) return;
  if (useMemory) {
    memCache.set(String(item.id), item);
    return;
  }
  await initOfflineDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO teachers_cache (id, data, pending, updated_at) VALUES (?, ?, ?, ?)',
    String(item.id),
    JSON.stringify(item),
    pending ? 1 : 0,
    now()
  );
}

export async function removeCachedTeacher(id) {
  if (useMemory) {
    memCache.delete(String(id));
    return;
  }
  await initOfflineDb();
  await db.runAsync('DELETE FROM teachers_cache WHERE id = ?', String(id));
}

export async function getCachedTeachers() {
  if (useMemory) return [...memCache.values()];
  await initOfflineDb();
  const rows = await db.getAllAsync('SELECT data FROM teachers_cache ORDER BY rowid ASC');
  return rows.map((r) => safeParse(r.data, null)).filter(Boolean);
}

export async function findCachedTeacher(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  const all = await getCachedTeachers();
  return (
    all.find((t) => String(t.id) === q) ||
    all.find((t) => String(t.name || '').toLowerCase() === q) ||
    all.find((t) => String(t.name || '').toLowerCase().includes(q)) ||
    null
  );
}

// --- Flags NUEVO (bajada desde la nube, persisten tras reinicio) ---

export async function listNewIds() {
  if (useMemory) return [...memNew.keys()];
  await initOfflineDb();
  const rows = await db.getAllAsync('SELECT id FROM cloud_new_flags ORDER BY detected_at ASC');
  return rows.map((r) => String(r.id));
}

export async function markTeachersAsNew(ids) {
  const arr = (Array.isArray(ids) ? ids : [ids]).map((v) => String(v));
  if (arr.length === 0) return [];
  const t = now();
  if (useMemory) {
    for (const id of arr) {
      if (!memNew.has(id)) memNew.set(id, t);
    }
    return [...memNew.keys()];
  }
  await initOfflineDb();
  for (const id of arr) {
    await db.runAsync('INSERT OR IGNORE INTO cloud_new_flags (id, detected_at) VALUES (?, ?)', id, t);
  }
  return listNewIds();
}

export async function clearNewFlag(id) {
  const key = String(id);
  if (useMemory) {
    memNew.delete(key);
    return;
  }
  await initOfflineDb();
  await db.runAsync('DELETE FROM cloud_new_flags WHERE id = ?', key);
}

// Limpia flags cuyos ids ya no existen en la nube (p. ej. borrados).
export async function pruneNewFlags(validIds) {
  const valid = new Set((Array.isArray(validIds) ? validIds : []).map((v) => String(v)));
  if (useMemory) {
    for (const id of [...memNew.keys()]) {
      if (!valid.has(id)) memNew.delete(id);
    }
    return;
  }
  await initOfflineDb();
  const rows = await db.getAllAsync('SELECT id FROM cloud_new_flags');
  for (const r of rows) {
    if (!valid.has(String(r.id))) {
      await db.runAsync('DELETE FROM cloud_new_flags WHERE id = ?', String(r.id));
    }
  }
}

// Ids numéricos con operaciones pendientes de subida (para detectar conflicto
// nube-vs-local antes de sobrescribir el espejo en la bajada).
export async function getPendingTeacherIds() {
  const ops = await listPendingOps();
  const set = new Set();
  for (const o of ops) {
    if (o.teacherId != null) set.add(String(Number(o.teacherId)));
  }
  return [...set];
}

// Descarta las ops pendientes de un docente (cuando el usuario elige
// quedarse con la versión de la nube en un conflicto nube-vs-local).
export async function dropPendingForTeacher(teacherId) {
  const num = Number(teacherId);
  if (!Number.isFinite(num)) return 0;
  const ops = await listPendingOps();
  let n = 0;
  for (const o of ops) {
    if (o.teacherId != null && Number(o.teacherId) === num) {
      await deleteOp(o.id);
      n += 1;
    }
  }
  return n;
}
