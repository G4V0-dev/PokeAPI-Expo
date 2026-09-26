// Cliente del microservicio propio. Solo fetch (sin axios), con estados loading/error/empty en Context.
// .env: EXPO_PUBLIC_API_URL=http://localhost:3001
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getPokemon(query, signal) {
  let q = String(query || '').toLowerCase().trim();
  if (!q) throw new ApiError('Ingresa un nombre o número', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10)); // IDs: "025" -> "25"
  let res;
  try {
    res = await fetch(`${BASE_URL}/consultaPokemon?query=${encodeURIComponent(q)}`, { signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    // Sin conexión al micro (apagado, IP mal o Expo sin reiniciar tras cambiar el env):
    throw new ApiError(`No se alcanzó el microservicio de búsqueda (${BASE_URL}).`, 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || 'Pokémon no encontrado.', res.status);
  return body;
}

export { BASE_URL };
