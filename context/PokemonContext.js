import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { getPokemon } from '../services/pokemonService';

const PokemonContext = createContext(null);

/**
 * PokemonProvider: pantalla Galeria muestra 3 imagenes, pantalla Datos muestra el resto.
 * Todo el fetch pasa por el microservicio propio /consultaPokemon (nunca directo a pokeapi.co).
 */
export function PokemonProvider({ children }) {
  const [pokemonData, setPokemonData] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('galeria'); // galeria | datos (Paint: naranja = activa)
  const abortRef = useRef(null);

  const fetchOne = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setIsLiked(false);
    try {
      const data = await getPokemon(q, ctrl.signal);
      setPokemonData(data);
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

  const next = useCallback(() => {
    fetchOne(currentId ? currentId + 1 : 1);
  }, [currentId, fetchOne]);

  const prev = useCallback(() => {
    if (currentId && currentId > 1) fetchOne(currentId - 1);
  }, [currentId, fetchOne]);

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
      activeTab,
      setActiveTab,
      search,
      next,
      prev,
      fetchOne,
    }),
    [pokemonData, currentId, query, loading, error, isLiked, activeTab, search, next, prev, fetchOne],
  );

  return <PokemonContext.Provider value={value}>{children}</PokemonContext.Provider>;
}

export function usePokemon() {
  const ctx = useContext(PokemonContext);
  if (!ctx) throw new Error('usePokemon debe usarse dentro de <PokemonProvider>');
  return ctx;
}
