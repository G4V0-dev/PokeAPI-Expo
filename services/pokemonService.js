// Cliente del microservicio cloud Pokémon (Supabase vía Render, solo URLs públicas).
// Sin fallback local por decisión de escalamiento: todo va a la nube.
// El timeout (20/40/80/160 s) llega desde SettingsContext.
import { createTimeoutSignal, timeoutMessage } from './http';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://pokeapi-expo.onrender.com';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchJson(url, signal, timeoutMs, subject) {
  const timeout = createTimeoutSignal(signal, timeoutMs);
  try {
    const res = await fetch(url, { signal: timeout.signal });
    const body = await res.json().catch(() => ({}));
    return { res, body };
  } catch (e) {
    if (timeout.didTimeout()) throw new ApiError(timeoutMessage(timeoutMs, subject), 408);
    if (e?.name === 'AbortError') throw e;
    throw new ApiError(
      `No se alcanzó el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  } finally {
    timeout.cleanup();
  }
}

export async function getPokemon(query, signal, timeoutMs) {
  let q = String(query || '').toLowerCase().trim();
  if (!q) throw new ApiError('Ingresa un nombre o número', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10)); // IDs: "025" -> "25"
  const { res, body } = await fetchJson(
    `${BASE_URL}/pokemons/${encodeURIComponent(q)}`,
    signal,
    timeoutMs,
    'El microservicio cloud de Pokémon'
  );
  if (!res.ok) throw new ApiError(body.error || 'Pokémon no encontrado en la nube (solo 10 disponibles).', res.status);
  return body;
}

let idsCache = null;

export async function getPokemonIds(signal, timeoutMs) {
  if (!idsCache) {
    const { res, body } = await fetchJson(
      `${BASE_URL}/pokemons`,
      signal,
      timeoutMs,
      'El catálogo cloud de Pokémon'
    );
    if (!res.ok) throw new ApiError('No se pudo listar los pokémon de la nube.', res.status);
    const list = Array.isArray(body) ? body : [];
    idsCache = list.map((x) => x.id);
  }
  return idsCache;
}

export { BASE_URL };
