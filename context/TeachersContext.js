import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createTeacher as createApi, deleteTeacher as deleteApi, getTeacher, getTeachers, updateTeacher as updateApi } from '../services/teachersService';

const TeachersContext = createContext(null);

/**
 * TeachersProvider: pantalla SIMPLE (sin tabs galeria/datos) + admin CRUD.
 * - Lista automatica de docentes al montar (4 estados).
 * - `selected` + `view` ('list' | 'detail'): el boton "Ver informacion"
 *   (FUERA de BottomTabs) lleva al detalle; "Volver" regresa a la lista.
 * - Admin: `formMode` (null | 'create' | 'edit') + `startCreate`,
 *   `startEdit`, `cancelForm`, `submitForm`, `removeTeacher`.
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
  const abortRef = useRef(null);

  const fetchList = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const data = await getTeachers(ctrl.signal, q);
      setList(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'Error de red');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
      return data;
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'Error de red');
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

  const openDetail = useCallback((item) => {
    if (!item) return;
    // Si la lista trae resumen, pedir detalle completo por id (path param).
    if (item.description) {
      setSelected(item);
      setView('detail');
    } else {
      fetchOne(item.id);
    }
  }, [fetchOne]);

  const goBack = useCallback(() => {
    setView('list');
    setSelected(null);
    setFormMode(null);
  }, []);

  // Carga automatica de docentes al montar (pantalla simple, sin buscar).
  useEffect(() => {
    fetchList('');
  }, [fetchList]);

  // --- Admin CRUD (UI) ---
  const startCreate = useCallback(() => {
    setError(null);
    setSelected(null);
    setFormMode('create');
    setView('list');
  }, []);

  const startEdit = useCallback(async (item) => {
    setError(null);
    // Si solo hay resumen, traer detalle completo antes de editar.
    if (item && !item.description && item.id) {
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
    setSaving(true);
    setError(null);
    try {
      if (formMode === 'edit' && selected?.id) {
        const updated = await updateApi(selected.id, payload);
        setSelected(updated);
      } else {
        await createApi(payload);
      }
      setFormMode(null);
      await fetchList('');
      return true;
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'No se pudo guardar');
      return false;
    } finally {
      setSaving(false);
    }
  }, [formMode, selected, fetchList]);

  const removeTeacher = useCallback(async (id) => {
    const num = Number(id);
    if (!Number.isFinite(num)) return false;
    setSaving(true);
    setError(null);
    try {
      await deleteApi(num);
      if (selected?.id === num) {
        setSelected(null);
        setView('list');
      }
      setFormMode(null);
      await fetchList('');
      return true;
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'No se pudo borrar');
      return false;
    } finally {
      setSaving(false);
    }
  }, [selected, fetchList]);

  const value = useMemo(
    () => ({
      list, selected, view, formMode, query, setQuery, loading, saving, error,
      isEmpty: !loading && !error && list.length === 0 && view === 'list' && !formMode,
      fetchList, fetchOne, search, openDetail, goBack,
      startCreate, startEdit, cancelForm, submitForm, removeTeacher,
    }),
    [list, selected, view, formMode, query, loading, saving, error, fetchList, fetchOne, search, openDetail, goBack, startCreate, startEdit, cancelForm, submitForm, removeTeacher]
  );

  return <TeachersContext.Provider value={value}>{children}</TeachersContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error('useTeachers debe usarse dentro de <TeachersProvider>');
  return ctx;
}
