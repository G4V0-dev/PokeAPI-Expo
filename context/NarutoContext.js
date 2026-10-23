import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { getNarutoCharacter } from '../services/narutoService';

const NarutoContext = createContext(null);

/**
 * NarutoProvider: espejo de PokemonProvider. Tab galería muestra imágenes + nombre +
 * clan/aldea + jutsu insignia; tab datos muestra el resto. Todo pasa por el
 * microservicio propio /consultaNaruto (puerto 3002), nunca directo a Dattebayo.
 */
export function NarutoProvider({ children }) {
  const [characterData, setCharacterData] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('galeria'); // galeria | datos
  const abortRef = useRef(null);

  const fetchOne = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const data = await getNarutoCharacter(q, ctrl.signal);
      setCharacterData(data);
      setCurrentId(data.id);
      setQuery(data.name);
      return data;
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setError(e.message || 'Error de red');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(() => {
    if (!query.trim()) {
      setError('Ingresa un nombre o número');
      return;
    }
    fetchOne(query);
  }, [query, fetchOne]);

  // Anterior/siguiente por vecinos del catálogo (los IDs no son secuenciales).
  const next = useCallback(() => {
    if (characterData?.nextId != null) fetchOne(characterData.nextId);
  }, [characterData, fetchOne]);

  const prev = useCallback(() => {
    if (characterData?.prevId != null) fetchOne(characterData.prevId);
  }, [characterData, fetchOne]);

  const value = useMemo(
    () => ({ characterData, currentId, query, setQuery, loading, error,
      isEmpty: !loading && !error && !characterData,
      activeTab, setActiveTab, search, next, prev, fetchOne }),
    [characterData, currentId, query, loading, error, activeTab, search, next, prev, fetchOne],
  );

  return <NarutoContext.Provider value={value}>{children}</NarutoContext.Provider>;
}

export function useNaruto() {
  const ctx = useContext(NarutoContext);
  if (!ctx) throw new Error('useNaruto debe usarse dentro de <NarutoProvider>');
  return ctx;
}
