import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createTeacher as createApi, deleteTeacher as deleteApi, getTeacher, getTeachers, updateTeacher as updateApi } from '../services/teachersService';
import { isNetworkError, isOnline, subscribeConnectivity } from '../services/connectivity';
import {
  OP_CREATE,
  OP_DELETE,
  OP_UPDATE,
  clearNewFlag,
  countPending,
  dropPendingForTeacher,
  enqueueOp,
  findCachedTeacher,
  getCachedTeachers,
  initOfflineDb,
  listNewIds,
  removeCachedTeacher,
  replaceCachedTeachers,
  upsertCachedTeacher,
} from '../services/offlineDb';
import { isTempId, makeTempId, processQueue, pullCloudChanges, startAutoSync } from '../services/syncEngine';

export const POLL_OPTIONS = [
  { label: 'OFF', ms: null },
  { label: '2s', ms: 2000 },
  { label: '10s', ms: 10000 },
  { label: '30s', ms: 30000 },
];

const TeachersContext = createContext(null);

function filterLocal(list, q) {
  const needle = String(q || '').trim().toLowerCase();
  if (!needle) return list;
  return list.filter(
    (t) =>
      String(t.name || '').toLowerCase().includes(needle) ||
      String(t.profession || '').toLowerCase().includes(needle) ||
      (Array.isArray(t.aliases) && t.aliases.some((a) => String(a).toLowerCase().includes(needle)))
  );
}

/**
 * TeachersProvider: pantalla SIMPLE (sin tabs galeria/datos) + admin CRUD.
 * - Lista automatica de docentes al montar (4 estados).
 * - `selected` + `view` ('list' | 'detail'): el boton "Ver informacion"
 *   (FUERA de BottomTabs) lleva al detalle; "Volver" regresa a la lista.
 * - Admin: `formMode` (null | 'create' | 'edit') + `startCreate`,
 *   `startEdit`, `cancelForm`, `submitForm`, `removeTeacher`.
 * - Offline transparente (SQLite + sync a DynamoDB): sin internet las
 *   escrituras se encolan (pending_ops) y la lista/detalle se sirven de
 *   teachers_cache. Al reconectar, syncEngine sincroniza FIFO solo.
 * Todo pasa por el micro teachers-cloud (DynamoDB), nunca directo a LinkedIn/Dynamo.
 */
export function TeachersProvider({ children }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // list | detail
  const [formMode, setFormMode] = useState(null); // null | create | edit
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Estado offline (transparente: no bloquea, solo informa sutil en UI).
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  // Bajada nube->local: intervalo solo-sesión (default OFF), flags NUEVO
  // persistentes en SQLite, último chequeo y conflictos nube-vs-local.
  const [pollIntervalMs, setPollIntervalMs] = useState(null);
  const [newIds, setNewIds] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [lastPullAt, setLastPullAt] = useState(null);
  const [pullStatus, setPullStatus] = useState('idle'); // idle|checking|ok|waking|offline
  const [pullMessage, setPullMessage] = useState(null);
  const abortRef = useRef(null);
  const pullingRef = useRef(false);
  const queryRef = useRef('');
  queryRef.current = query;

  const refreshPending = useCallback(async () => {
    try {
      setPendingCount(await countPending());
    } catch {
      // Sin cola disponible: no romper la UI.
    }
  }, []);

  const fetchList = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const data = await getTeachers(ctrl.signal, q);
      const arr = Array.isArray(data) ? data : [];
      setList(arr);
      setIsOffline(false);
      replaceCachedTeachers(arr).catch(() => {});
      refreshPending();
      return arr;
    } catch (e) {
      if (e?.name === 'AbortError') return null;
      if (isNetworkError(e)) {
        // Transparente: servir caché local en vez de error bloqueante.
        const cached = await getCachedTeachers().catch(() => []);
        const filtered = filterLocal(cached, q);
        setIsOffline(true);
        refreshPending();
        if (filtered.length > 0 || (cached.length > 0 && !String(q || '').trim())) {
          setList(filtered);
          setError(null);
          return filtered;
        }
        setList([]);
        setError('Sin conexión. Los cambios se guardarán y sincronizarán al volver internet.');
        return null;
      }
      setError(e.message || 'Error de red');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshPending]);

  const fetchOne = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const data = await getTeacher(q, ctrl.signal);
      setSelected(data);
      setView('detail');
      setIsOffline(false);
      return data;
    } catch (e) {
      if (e?.name === 'AbortError') return null;
      if (isNetworkError(e)) {
        const local = await findCachedTeacher(q).catch(() => null);
        setIsOffline(true);
        if (local) {
          setSelected(local);
          setView('detail');
          setError(null);
          return local;
        }
        setError('Sin conexión y sin copia local de ese docente.');
        return null;
      }
      setError(e.message || 'Error de red');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(() => {
    setView('list');
    setSelected(null);
    fetchList(query);
  }, [query, fetchList]);

  const dismissNew = useCallback((id) => {
    if (id == null) return;
    clearNewFlag(id).catch(() => {});
    setNewIds((prev) => prev.filter((v) => String(v) !== String(id)));
  }, []);

  const openDetail = useCallback((item) => {
    if (!item) return;
    // Ver el docente consume su badge NUEVO (bajada desde la nube).
    dismissNew(item.id);
    // Si la lista trae resumen, pedir detalle completo por id (path param).
    if (item.description || isTempId(item.id)) {
      setSelected(item);
      setView('detail');
    } else {
      fetchOne(item.id);
    }
  }, [fetchOne, dismissNew]);

  const goBack = useCallback(() => {
    setView('list');
    setSelected(null);
    setFormMode(null);
  }, []);

  // Init offline + carga inicial + auto-sync (una sola vez).
  useEffect(() => {
    let alive = true;
    let stopAuto = null;
    (async () => {
      await initOfflineDb().catch(() => {});
      if (!alive) return;
      const cached = await getCachedTeachers().catch(() => []);
      if (alive && cached.length > 0) setList(cached);
      if (alive) refreshPending();
      if (alive) {
        const flags = await listNewIds().catch(() => []);
        setNewIds(flags);
      }
      if (alive) fetchList('');
    })();
    const unsubNet = subscribeConnectivity((online) => {
      if (!alive) return;
      setIsOffline(!online);
      if (online) {
        setSyncing(true);
        processQueue()
          .then((s) => {
            if (!alive) return;
            refreshPending();
            if (s && s.synced > 0) fetchList('');
            if (s && s.failed > 0) setSyncError('Algún pendiente fue rechazado por la nube (revisa datos).');
            else setSyncError(null);
          })
          .catch(() => {})
          .finally(() => {
            if (alive) setSyncing(false);
          });
      }
    });
    stopAuto = startAutoSync({
      onChange: (s) => {
        if (!alive) return;
        refreshPending();
        if (s && s.synced > 0) fetchList('');
      },
    });
    return () => {
      alive = false;
      unsubNet();
      if (stopAuto) stopAuto();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Bajada nube->local: chequeo puntual + polling parametrizable ---

  const pullNow = useCallback(async () => {
    if (pullingRef.current) return null;
    if (AppState.currentState !== 'active') return null;
    pullingRef.current = true;
    setPullStatus('checking');
    setPullMessage(null);
    try {
      const r = await pullCloudChanges();
      setLastPullAt(Date.now());
      if (!r.ok) {
        setPullStatus(r.offline ? 'offline' : 'waking');
        setPullMessage(
          r.offline
            ? 'Sin conexión: el monitoreo sigue activo, sin revisar la nube.'
            : 'Render despertando (~50s en plan gratis): la nube no respondió, se reintenta en el próximo intervalo.'
        );
        return r;
      }
      setPullStatus('ok');
      setIsOffline(false);
      const flags = await listNewIds().catch(() => []);
      setNewIds(flags);
      if (r.conflicts && r.conflicts.length > 0) {
        setConflicts((prev) => {
          const known = new Set(prev.map((c) => String(c.id)));
          const fresh = r.conflicts.filter((c) => !known.has(String(c.id)));
          return [...prev, ...fresh];
        });
        setPullMessage(
          'Hay cambios en la nube que chocan con pendientes sin subir: elige qué versión conservar.'
        );
      } else if (r.newIds.length > 0 || r.updatedIds.length > 0 || r.deletedIds.length > 0) {
        const parts = [];
        if (r.newIds.length > 0) parts.push(`${r.newIds.length} nuevo(s)`);
        if (r.updatedIds.length > 0) parts.push(`${r.updatedIds.length} actualizado(s)`);
        if (r.deletedIds.length > 0) parts.push(`${r.deletedIds.length} eliminado(s)`);
        setPullMessage(`Nube sincronizada: ${parts.join(', ')}.`);
      } else {
        setPullMessage('Nube sin cambios.');
      }
      // Refrescar lista solo si el usuario no está filtrando.
      if (!String(queryRef.current || '').trim()) {
        const all = await getCachedTeachers().catch(() => r.cloudList);
        const temps = (all || []).filter((t) => isTempId(t.id));
        setList([...temps, ...r.cloudList]);
      }
      refreshPending();
      return r;
    } catch (e) {
      setLastPullAt(Date.now());
      setPullStatus('waking');
      setPullMessage('No se pudo revisar la nube (posible Render despertando). Se reintenta en el próximo intervalo.');
      return null;
    } finally {
      pullingRef.current = false;
    }
  }, [refreshPending]);

  // Polling solo-sesión y solo-foreground: se resetea al reiniciar (OFF).
  useEffect(() => {
    if (!pollIntervalMs) return undefined;
    pullNow();
    const timer = setInterval(pullNow, pollIntervalMs);
    return () => clearInterval(timer);
  }, [pollIntervalMs, pullNow]);

  // Conflicto nube-vs-local: 'cloud' conserva la nube (y descarta lo
  // pendiente de ese docente para no resubirlo); 'local' mantiene lo pendiente.
  const resolveConflict = useCallback(async (id, keep) => {
    const key = String(id);
    const conflict = conflicts.find((c) => String(c.id) === key);
    if (keep === 'cloud' && conflict) {
      if (conflict.cloud) {
        await upsertCachedTeacher(conflict.cloud, false).catch(() => {});
        setList((prev) => {
          const exists = prev.some((t) => String(t.id) === key);
          if (exists) return prev.map((t) => (String(t.id) === key ? conflict.cloud : t));
          return [conflict.cloud, ...prev];
        });
      } else {
        await removeCachedTeacher(key).catch(() => {});
        setList((prev) => prev.filter((t) => String(t.id) !== key));
      }
      const num = Number(key);
      if (Number.isFinite(num)) await dropPendingForTeacher(num).catch(() => {});
      dismissNew(key);
      refreshPending();
    }
    setConflicts((prev) => prev.filter((c) => String(c.id) !== key));
  }, [conflicts, dismissNew, refreshPending]);

  // --- Admin CRUD (UI) con ruta offline transparente ---

  const startCreate = useCallback(() => {
    setError(null);
    setSelected(null);
    setFormMode('create');
    setView('list');
  }, []);

  const startEdit = useCallback(async (item) => {
    setError(null);
    // Si solo hay resumen, traer detalle completo antes de editar.
    if (item && !item.description && item.id && !isTempId(item.id)) {
      const full = await fetchOne(item.id);
      if (!full) return;
    } else if (item) {
      setSelected(item);
    }
    setFormMode('edit');
  }, [fetchOne]);

  const cancelForm = useCallback(() => {
    setFormMode(null);
  }, []);

  const submitForm = useCallback(async (payload) => {
    const body = { ...(payload || {}) };
    // Validación local espejo del server (400): no se encola lo inválido.
    if (!String(body.name || '').trim() || !String(body.profession || '').trim()) {
      setError('Nombre y profesión son obligatorios.');
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      // --- EDITAR ---
      if (formMode === 'edit' && selected?.id != null) {
        const targetId = selected.id;
        // Editando un pendiente aún no sincronizado: fusionar en su CREATE.
        if (isTempId(targetId)) {
          await enqueueOp({ op: OP_UPDATE, tempId: targetId, payload: body });
          const merged = { ...selected, ...body };
          setSelected(merged);
          setList((prev) => prev.map((t) => (t.id === targetId ? merged : t)));
          upsertCachedTeacher(merged, true).catch(() => {});
          setFormMode(null);
          refreshPending();
          return true;
        }
        if (!(await isOnline())) {
          await enqueueOp({ op: OP_UPDATE, teacherId: Number(targetId), payload: body });
          const merged = { ...selected, ...body };
          setSelected(merged);
          setList((prev) => prev.map((t) => (String(t.id) === String(targetId) ? merged : t)));
          upsertCachedTeacher(merged, true).catch(() => {});
          setIsOffline(true);
          setFormMode(null);
          refreshPending();
          return true;
        }
        try {
          const updated = await updateApi(targetId, body);
          setSelected(updated);
          setFormMode(null);
          await fetchList('');
          return true;
        } catch (e) {
          if (e?.name !== 'AbortError' && isNetworkError(e)) {
            await enqueueOp({ op: OP_UPDATE, teacherId: Number(targetId), payload: body });
            const merged = { ...selected, ...body };
            setSelected(merged);
            setList((prev) => prev.map((t) => (String(t.id) === String(targetId) ? merged : t)));
            upsertCachedTeacher(merged, true).catch(() => {});
            setIsOffline(true);
            setFormMode(null);
            refreshPending();
            return true;
          }
          throw e;
        }
      }

      // --- CREAR ---
      if (!(await isOnline())) {
        const tempId = makeTempId();
        const item = { id: tempId, ...body };
        await enqueueOp({ op: OP_CREATE, tempId, payload: body });
        setList((prev) => [item, ...prev]);
        upsertCachedTeacher(item, true).catch(() => {});
        setIsOffline(true);
        setFormMode(null);
        refreshPending();
        return true;
      }
      try {
        await createApi(body);
        setFormMode(null);
        await fetchList('');
        return true;
      } catch (e) {
        if (e?.name !== 'AbortError' && isNetworkError(e)) {
          const tempId = makeTempId();
          const item = { id: tempId, ...body };
          await enqueueOp({ op: OP_CREATE, tempId, payload: body });
          setList((prev) => [item, ...prev]);
          upsertCachedTeacher(item, true).catch(() => {});
          setIsOffline(true);
          setFormMode(null);
          refreshPending();
          return true;
        }
        throw e;
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'No se pudo guardar');
      return false;
    } finally {
      setSaving(false);
    }
  }, [formMode, selected, fetchList, refreshPending]);

  const removeTeacher = useCallback(async (id) => {
    // Borrado de un pendiente aún no sincronizado: anula su CREATE.
    if (isTempId(id)) {
      setSaving(true);
      try {
        await enqueueOp({ op: OP_DELETE, tempId: id, payload: {} });
        setList((prev) => prev.filter((t) => t.id !== id));
        removeCachedTeacher(id).catch(() => {});
        if (selected && String(selected.id) === String(id)) {
          setSelected(null);
          setView('list');
        }
        setFormMode(null);
        refreshPending();
        return true;
      } finally {
        setSaving(false);
      }
    }
    const num = Number(id);
    if (!Number.isFinite(num)) return false;
    setSaving(true);
    setError(null);
    const optimisticRemove = () => {
      setList((prev) => prev.filter((t) => String(t.id) !== String(num)));
      removeCachedTeacher(num).catch(() => {});
      if (selected && String(selected.id) === String(num)) {
        setSelected(null);
        setView('list');
      }
      setFormMode(null);
    };
    try {
      if (!(await isOnline())) {
        await enqueueOp({ op: OP_DELETE, teacherId: num, payload: {} });
        optimisticRemove();
        setIsOffline(true);
        refreshPending();
        return true;
      }
      try {
        await deleteApi(num);
        setFormMode(null);
        await fetchList('');
        refreshPending();
        return true;
      } catch (e) {
        if (e?.name !== 'AbortError' && isNetworkError(e)) {
          await enqueueOp({ op: OP_DELETE, teacherId: num, payload: {} });
          optimisticRemove();
          setIsOffline(true);
          refreshPending();
          return true;
        }
        throw e;
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'No se pudo borrar');
      return false;
    } finally {
      setSaving(false);
    }
  }, [selected, fetchList, refreshPending]);

  // Reintento manual (además del auto al reconectar).
  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const summary = await processQueue();
      await refreshPending();
      if (summary && summary.synced > 0) await fetchList('');
      if (summary && summary.failed > 0) setSyncError('Algún pendiente fue rechazado por la nube (revisa datos).');
      return summary;
    } catch (e) {
      setSyncError(e?.message || 'No se pudo sincronizar');
      return null;
    } finally {
      setSyncing(false);
    }
  }, [fetchList, refreshPending]);

  const value = useMemo(
    () => ({
      list, selected, view, formMode, query, setQuery, loading, saving, error,
      isEmpty: !loading && !error && list.length === 0 && view === 'list' && !formMode,
      fetchList, fetchOne, search, openDetail, goBack,
      startCreate, startEdit, cancelForm, submitForm, removeTeacher,
      // Offline transparente:
      isOffline, pendingCount, syncing, syncError, syncNow,
      // Bajada nube->local + monitoreo + flags NUEVO:
      pollIntervalMs, setPollIntervalMs, pullNow, lastPullAt, pullStatus, pullMessage,
      newIds, newCount: newIds.length, dismissNew,
      conflicts, resolveConflict,
    }),
    [list, selected, view, formMode, query, loading, saving, error, fetchList, fetchOne, search, openDetail, goBack, startCreate, startEdit, cancelForm, submitForm, removeTeacher, isOffline, pendingCount, syncing, syncError, syncNow, pollIntervalMs, pullNow, lastPullAt, pullStatus, pullMessage, newIds, dismissNew, conflicts, resolveConflict]
  );

  return <TeachersContext.Provider value={value}>{children}</TeachersContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error('useTeachers debe usarse dentro de <TeachersProvider>');
  return ctx;
}
