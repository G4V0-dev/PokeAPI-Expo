// Cliente del microservicio propio de Naruto. Espejo de pokemonService.js.
// .env: EXPO_PUBLIC_NARUTO_API_URL=http://localhost:3002
const BASE_URL = process.env.EXPO_PUBLIC_NARUTO_API_URL || 'http://localhost:3002';

export class NarutoApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'NarutoApiError';
    this.status = status;
  }
}

export async function getNarutoCharacter(query, signal) {
  let q = String(query || '').trim();
  if (!q) throw new NarutoApiError('Ingresa un nombre o número', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10)); // IDs: "01307" -> "1307"
  else q = q.toLowerCase();
  let res;
  try {
    res = await fetch(`${BASE_URL}/consultaNaruto?query=${encodeURIComponent(q)}`, { signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    // Sin conexión al micro (apagado, IP mal o Expo sin reiniciar tras cambiar el env):
    throw new NarutoApiError(`No se alcanzó el microservicio de búsqueda (${BASE_URL}).`, 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new NarutoApiError(body.error || 'Personaje no encontrado.', res.status);
  return body;
}

export { BASE_URL as NARUTO_BASE_URL };
