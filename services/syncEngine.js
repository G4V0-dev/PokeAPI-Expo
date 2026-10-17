// Motor de sincronización offline <-> DynamoDB (vía micro teachers-cloud).
// Subida (decisiones del análisis aprobado):
// - Cola FIFO por created_at, disparo automático al reconectar.
// - Last-write-wins: lo offline sobrescribe la nube.
// - Backoff "tiempo prudente": 30s -> 2min -> 10min -> 1h (máx 10 intentos).
// - 404 en DELETE = éxito idempotente. 404 en UPDATE = se recrea con POST.
// - 400/403/405 = definitivo, no se reintenta (pasa a 'failed' visible).
// Bajada (polling comparativo, sin tocar el backend):
// - pullCloudChanges(): GET /teachers + diff por IDs y hash de resumen
//   (name/profession/headline/photo/profileUrl). Detecta nuevos, actualizados
//   y eliminados directos en DynamoDB y actualiza el espejo SQLite.
// - Si un id actualizado/borrado en nube tiene ops pendientes de subida,
//   NO se sobrescribe: se devuelve como conflicto para preguntar al usuario.
import { AppState } from 'react-native';
import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from './teachersService';
import {
  OP_CREATE,
  OP_DELETE,
  OP_UPDATE,
  countPending,
  deleteOp,
  getCachedTeachers,
  getPendingTeacherIds,
  listDueOps,
  markOpFailed,
  markOpRetry,
  markTeachersAsNew,
  pruneNewFlags,
  remapTempId,
  removeCachedTeacher,
  upsertCachedTeacher,
} from './offlineDb';
import { isNetworkError, isOnline, isRetriableStatus, subscribeConnectivity } from './connectivity';

export const MAX_ATTEMPTS = 10;
// 30s, 2min, 10min, 1h (desde el 4to intento se queda en 1h).
const BACKOFF_MS = [30 * 1000, 2 * 60 * 1000, 10 * 60 * 1000, 60 * 60 * 1000];

export function nextRetryDelay(attempts) {
  const i = Math.min(Math.max(0, attempts), BACKOFF_MS.length - 1);
  return BACKOFF_MS[i];
}

export function makeTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isTempId(id) {
  return typeof id === 'string' && id.startsWith('temp-');
}

let processing = false;
const listeners = new Set();

export function subscribeSync(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(summary) {
  listeners.forEach((cb) => {
    try {
      cb(summary);
    } catch {
      // No romper la sync por un listener.
    }
  });
}

async function executeOp(op) {
  if (op.op === OP_CREATE) return createTeacher(op.payload);
  const numericId = Number(op.teacherId);
  if (!Number.isFinite(numericId)) {
    const err = new Error('PUT/PATCH/DELETE solo por ID numérico.');
    err.status = 400;
    throw err;
  }
  if (op.op === OP_UPDATE) return updateTeacher(numericId, op.payload);
  if (op.op === OP_DELETE) return deleteTeacher(numericId);
  const err = new Error(`Operación desconocida: ${op.op}`);
  err.status = 400;
  throw err;
}

// Procesa la cola pendiente en orden FIFO. Seguro ante llamadas concurrentes.
export async function processQueue() {
  if (processing) return { skipped: true, synced: 0, retried: 0, failed: 0 };
  processing = true;
  const summary = { synced: 0, retried: 0, failed: 0, offline: false, skipped: false };
  try {
    if (!(await isOnline())) {
      summary.offline = true;
      return summary;
    }
    const due = await listDueOps(Date.now());
    for (const op of due) {
      try {
        const result = await executeOp(op);
        // CREATE offline -> remap temp a ID real de DynamoDB.
        if (op.op === OP_CREATE && op.tempId && result && result.id != null) {
          await remapTempId(op.tempId, result.id);
          await upsertCachedTeacher(result, false);
        } else if (op.op !== OP_DELETE && result && result.id != null) {
          await upsertCachedTeacher(result, false);
        } else if (op.op === OP_DELETE && op.teacherId != null) {
          await removeCachedTeacher(op.teacherId);
        }
        await deleteOp(op.id);
        summary.synced += 1;
      } catch (e) {
        const status = e?.status;
        // Idempotencia last-write-wins: borrar lo ya borrado = éxito.
        if (op.op === OP_DELETE && status === 404) {
          if (op.teacherId != null) await removeCachedTeacher(op.teacherId);
          await deleteOp(op.id);
          summary.synced += 1;
          continue;
        }
        // UPDATE sobre registro que ya no existe -> recrear (no perder datos).
        if (op.op === OP_UPDATE && status === 404) {
          try {
            const recreated = await createTeacher(op.payload);
            if (op.tempId && recreated?.id != null) await remapTempId(op.tempId, recreated.id);
            if (recreated?.id != null) await upsertCachedTeacher(recreated, false);
            await deleteOp(op.id);
            summary.synced += 1;
            continue;
          } catch (recreateError) {
            await handleOpError(op, recreateError, summary);
            continue;
          }
        }
        await handleOpError(op, e, summary);
      }
    }
    summary.pending = await countPending().catch(() => 0);
    notify(summary);
    return summary;
  } finally {
    processing = false;
  }
}

async function handleOpError(op, e, summary) {
  // Definitivo (validación/IAM): no reintentar, queda visible en 'failed'.
  if (!isNetworkError(e) && !isRetriableStatus(e?.status)) {
    await markOpFailed(op.id, e?.message || 'Error definitivo');
    summary.failed += 1;
    return;
  }
  const attempts = Number(op.attempts || 0);
  if (attempts + 1 >= MAX_ATTEMPTS) {
    await markOpFailed(op.id, `Máx reintentos (${MAX_ATTEMPTS}): ${e?.message || 'error'}`);
    summary.failed += 1;
    return;
  }
  await markOpRetry(op.id, e?.message || 'Error de red', Date.now() + nextRetryDelay(attempts));
  summary.retried += 1;
}

let autoStarted = false;

// Auto-sync: reconexión + foreground + intervalo de respaldo cada 60s.
export function startAutoSync({ onChange } = {}) {
  if (onChange) subscribeSync(onChange);
  if (autoStarted) return () => {};
  autoStarted = true;

  const unsubNet = subscribeConnectivity((online) => {
    if (online) processQueue().catch(() => {});
  });
  const subApp = AppState.addEventListener('change', (state) => {
    if (state === 'active') processQueue().catch(() => {});
  });
  const timer = setInterval(() => {
    countPending()
      .then((n) => {
        if (n > 0) processQueue().catch(() => {});
      })
      .catch(() => {});
  }, 60 * 1000);

  return () => {
    unsubNet();
    subApp.remove();
    clearInterval(timer);
    autoStarted = false;
  };
}

// --- Bajada nube -> SQLite (polling comparativo, sin cambios en backend) ---

function summaryHash(t) {
  return JSON.stringify([
    t?.name || '',
    t?.profession || '',
    t?.headline || '',
    t?.photo || '',
    t?.profileUrl || '',
  ]);
}

function emptyPull(extra) {
  return {
    ok: false,
    offline: false,
    waking: false,
    newIds: [],
    updatedIds: [],
    deletedIds: [],
    conflicts: [],
    cloudList: [],
    ...(extra || {}),
  };
}

// Compara GET /teachers (lista completa) contra teachers_cache y aplica al
// espejo local lo que cambió directo en DynamoDB. Devuelve el diff para que el
// contexto pinte banner NUEVO, borrados y modal de conflicto.
// - 503 / sin red (Render dormido o sin internet) -> { ok:false, waking:true }
//   sin tocar la caché.
// - Ids con pendientes de subida nunca se sobrescriben: van a `conflicts`
//   ({ id, cloud|null, local }) para preguntar al usuario.
export async function pullCloudChanges() {
  if (!(await isOnline())) return emptyPull({ offline: true });
  let cloud;
  try {
    cloud = await getTeachers(undefined, '');
  } catch (e) {
    if (isNetworkError(e) || (e?.status != null && e.status >= 500)) {
      return emptyPull({ waking: true, message: e?.message || 'Render despertando' });
    }
    throw e;
  }
  const cloudList = Array.isArray(cloud) ? cloud : [];
  const cached = await getCachedTeachers().catch(() => []);
  const cachedById = new Map(cached.map((t) => [String(t.id), t]));
  const cloudById = new Map(cloudList.map((t) => [String(t.id), t]));
  const pendingIds = new Set(await getPendingTeacherIds().catch(() => []));

  const newIds = [];
  const updatedIds = [];
  const deletedIds = [];
  const conflicts = [];

  for (const [id, c] of cloudById) {
    if (isTempId(id)) continue; // la nube nunca devuelve temp-
    if (!cachedById.has(id)) {
      newIds.push(id);
    } else if (summaryHash(cachedById.get(id)) !== summaryHash(c)) {
      if (pendingIds.has(id)) {
        conflicts.push({ id, cloud: c, local: cachedById.get(id) });
      } else {
        updatedIds.push(id);
      }
    }
  }
  for (const [id, local] of cachedById) {
    if (isTempId(id)) continue; // creados offline: los sube processQueue, no el pull
    if (!cloudById.has(id)) {
      if (pendingIds.has(id)) {
        conflicts.push({ id, cloud: null, local });
      } else {
        deletedIds.push(id);
      }
    }
  }

  for (const id of newIds) {
    await upsertCachedTeacher(cloudById.get(id), false).catch(() => {});
  }
  for (const id of updatedIds) {
    await upsertCachedTeacher(cloudById.get(id), false).catch(() => {});
  }
  for (const id of deletedIds) {
    await removeCachedTeacher(id).catch(() => {});
  }
  if (newIds.length > 0) {
    await markTeachersAsNew(newIds).catch(() => {});
  }
  await pruneNewFlags([...cloudById.keys()]).catch(() => {});

  return { ok: true, offline: false, waking: false, newIds, updatedIds, deletedIds, conflicts, cloudList };
}
