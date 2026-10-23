import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSettings } from './SettingsContext';
import { getPokemon, getPokemonIds } from '../services/pokemonService';

const PokemonContext = createContext(null);

/**
 * PokemonProvider: pantalla Galeria muestra 3 imagenes, pantalla Datos muestra el resto.
 * Todo el fetch pasa por el microservicio cloud /pokemons (nunca directo a pokeapi.co).
 */
export function PokemonProvider({ children }) {
  const { timeoutMs } = useSettings();
  const [pokemonData, setPokemonData] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(false);
  const [activeTab, setActiveTab] = useState('galeria'); // galeria | datos (Paint: naranja = activa)
  const abortRef = useRef(null);
  const requestRef = useRef(0);

  const fetchOne = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError(null);
    setIsLiked(false);
    try {
      const data = await getPokemon(q, ctrl.signal, timeoutMs);
      if (requestId !== requestRef.current) return null;
      setPokemonData(data);
      setCurrentId(data.id);
      setQuery(data.name);
      getPokemonIds(undefined, timeoutMs)
        .then((ids) => {
          if (requestId !== requestRef.current) return;
          setIsFirst(ids[0] === data.id);
          setIsLast(ids[ids.length - 1] === data.id);
        })
        .catch(() => {});
      return data;
    } catch (e) {
      if (requestId === requestRef.current && e?.name !== 'AbortError') {
        setError(e.message || 'Error de red');
      }
      return null;
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [timeoutMs]);

  const search = useCallback(() => {
    if (!query.trim()) {
      setError('Ingresa un nombre o número');
      return;
    }
    fetchOne(query);
  }, [query, fetchOne]);

  // Anterior/siguiente por IDs de la nube (solo 10, no secuenciales).
  const next = useCallback(async () => {
    const requestId = requestRef.current;
    try {
      const ids = await getPokemonIds(undefined, timeoutMs);
      if (requestId !== requestRef.current) return;
      const i = ids.indexOf(currentId);
      if (i >= 0 && i < ids.length - 1) fetchOne(ids[i + 1]);
    } catch (e) {
      if (requestId === requestRef.current && e?.name !== 'AbortError') {
        setError(e.message || 'Error de red');
      }
    }
  }, [currentId, fetchOne, timeoutMs]);

  const prev = useCallback(async () => {
    const requestId = requestRef.current;
    try {
      const ids = await getPokemonIds(undefined, timeoutMs);
      if (requestId !== requestRef.current) return;
      const i = ids.indexOf(currentId);
      if (i > 0) fetchOne(ids[i - 1]);
    } catch (e) {
      if (requestId === requestRef.current && e?.name !== 'AbortError') {
        setError(e.message || 'Error de red');
      }
    }
  }, [currentId, fetchOne, timeoutMs]);

  const value = useMemo(
    () => ({
      pokemonData,
      currentId,
      query,
      setQuery,
      loading,
      error,
      isEmpty: !loading && !error && !pokemonData,
      isLiked,
      setIsLiked,
      isFirst,
      isLast,
      activeTab,
      setActiveTab,
      search,
      next,
      prev,
      fetchOne,
    }),
    [pokemonData, currentId, query, loading, error, isLiked, isFirst, isLast, activeTab, search, next, prev, fetchOne],
  );

  return <PokemonContext.Provider value={value}>{children}</PokemonContext.Provider>;
}

export function usePokemon() {
  const ctx = useContext(PokemonContext);
  if (!ctx) throw new Error('usePokemon debe usarse dentro de <PokemonProvider>');
  return ctx;
}
