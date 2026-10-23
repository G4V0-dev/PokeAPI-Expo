// Cliente del microservicio propio de Naruto. Espejo de pokemonService.js.
// Local por defecto: http://localhost:3002. Si EXPO_PUBLIC_NARUTO_API_URL trae una
// IP LAN vieja/inaccesible, reintenta una vez contra localhost sin pedir re-export.
const PRIMARY_URL = process.env.EXPO_PUBLIC_NARUTO_API_URL || 'http://localhost:3002';
const LOCAL_URL = 'http://localhost:3002';
const BASE_URL = PRIMARY_URL;

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
  const path = `/consultaNaruto?query=${encodeURIComponent(q)}`;
  const candidates = PRIMARY_URL === LOCAL_URL ? [PRIMARY_URL] : [PRIMARY_URL, LOCAL_URL];
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}${path}`, { signal });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new NarutoApiError(body.error || 'Personaje no encontrado.', res.status);
      return body;
    } catch (e) {
      if (e?.name === 'AbortError' || e instanceof NarutoApiError) throw e;
      // Sin conexión al micro (apagado, IP LAN vieja): prueba siguiente candidato.
      continue;
    }
  }
  throw new NarutoApiError(`No se alcanzó el microservicio de búsqueda (${candidates.join(' / ')}). Revisa que backend-naruto :3002 esté arriba.`, 0);
}

export { BASE_URL as NARUTO_BASE_URL };
