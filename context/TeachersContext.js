import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getTeacher, getTeachers } from '../services/teachersService';

const TeachersContext = createContext(null);

/**
 * TeachersProvider: pantalla SIMPLE (sin tabs galeria/datos).
 * - Lista automatica de los 3 docentes al montar (4 estados).
 * - `selected` + `view` ('list' | 'detail'): el boton "Ver informacion"
 *   (FUERA de BottomTabs) lleva al detalle; "Volver" regresa a la lista.
 * Todo pasa por el micro teachers-cloud, nunca directo a LinkedIn/Dynamo.
 */
export function TeachersProvider({ children }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // list | detail
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  }, []);

  // Carga automatica de los 3 docentes al montar (pantalla simple, sin buscar).
  useEffect(() => {
    fetchList('');
  }, [fetchList]);

  const value = useMemo(
    () => ({
      list, selected, view, query, setQuery, loading, error,
      isEmpty: !loading && !error && list.length === 0 && view === 'list',
      fetchList, fetchOne, search, openDetail, goBack,
    }),
    [list, selected, view, query, loading, error, fetchList, fetchOne, search, openDetail, goBack]
  );

  return <TeachersContext.Provider value={value}>{children}</TeachersContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error('useTeachers debe usarse dentro de <TeachersProvider>');
  return ctx;
}
