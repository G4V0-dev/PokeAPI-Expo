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
  const res = await fetch(`${BASE_URL}/consultaPokemon?query=${encodeURIComponent(q)}`, { signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || 'Pokémon no encontrado.', res.status);
  return body;
}

export { BASE_URL };
