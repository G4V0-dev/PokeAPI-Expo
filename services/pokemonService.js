// Cliente del microservicio cloud Pokémon (Supabase vía Render, solo URLs públicas).
// Sin fallback local por decisión de escalamiento: todo va a la nube.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://pokeapi-expo.onrender.com';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchJson(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch {
    throw new ApiError(
      `No se alcanzó el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  }
  return res;
}

export async function getPokemon(query, signal) {
  let q = String(query || '').toLowerCase().trim();
  if (!q) throw new ApiError('Ingresa un nombre o número', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10)); // IDs: "025" -> "25"
  const res = await fetchJson(`${BASE_URL}/pokemons/${encodeURIComponent(q)}`, signal);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || 'Pokémon no encontrado en la nube (solo 10 disponibles).', res.status);
  return body;
}

let idsCache = null;

export async function getPokemonIds(signal) {
  if (!idsCache) {
    const res = await fetchJson(`${BASE_URL}/pokemons`, signal);
    if (!res.ok) throw new ApiError('No se pudo listar los pokémon de la nube.', res.status);
    const list = await res.json().catch(() => []);
    idsCache = list.map((x) => x.id);
  }
  return idsCache;
}

export { BASE_URL };
