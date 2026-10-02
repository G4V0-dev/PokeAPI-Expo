// Cliente del microservicio cloud Anime (DynamoDB vía Render, solo URLs públicas).
// Sin fallback local por decisión de escalamiento: todo va a la nube.
const BASE_URL = process.env.EXPO_PUBLIC_NARUTO_API_URL || 'https://pokeapi-expo-naruto.onrender.com';

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
    res = await fetch(`${BASE_URL}/characters/${encodeURIComponent(q)}`, { signal });
  } catch {
    throw new NarutoApiError(
      `No se alcanzó el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new NarutoApiError(body.detail || body.error || 'Personaje no encontrado en la nube (solo 10 disponibles).', res.status);
  return body;
}

export { BASE_URL as NARUTO_BASE_URL };
