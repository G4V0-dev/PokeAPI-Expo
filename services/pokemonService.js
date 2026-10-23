// Cliente del microservicio propio. Solo fetch (sin axios), con estados loading/error/empty en Context.
// Local por defecto: http://localhost:3001. Si EXPO_PUBLIC_API_URL trae una IP LAN
// vieja/inaccesible, reintenta una vez contra localhost sin pedir re-export.
// El timeout (20/40/80/160 s) llega desde SettingsContext.
import { createTimeoutSignal, timeoutMessage } from './http';

const PRIMARY_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const LOCAL_URL = 'http://localhost:3001';
const BASE_URL = PRIMARY_URL;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getPokemon(query, signal, timeoutMs) {
  let q = String(query || '').toLowerCase().trim();
  if (!q) throw new ApiError('Ingresa un nombre o número', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10)); // IDs: "025" -> "25"
  const path = `/consultaPokemon?query=${encodeURIComponent(q)}`;
  // Intento 1: URL configurada. Intento 2 (solo si falla red y difiere): localhost.
  const candidates = PRIMARY_URL === LOCAL_URL ? [PRIMARY_URL] : [PRIMARY_URL, LOCAL_URL];
  for (const base of candidates) {
    const timeout = createTimeoutSignal(signal, timeoutMs);
    try {
      const res = await fetch(`${base}${path}`, { signal: timeout.signal });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(body.error || 'Pokémon no encontrado.', res.status);
      return body;
    } catch (e) {
      if (timeout.didTimeout()) throw new ApiError(timeoutMessage(timeoutMs, 'El microservicio de Pokémon'), 408);
      if (e?.name === 'AbortError' || e instanceof ApiError) throw e;
      // Sin conexión al micro (apagado, IP LAN vieja): prueba siguiente candidato.
      continue;
    } finally {
      timeout.cleanup();
    }
  }
  // Sin conexión en ningún candidato (micros apagados o red bloqueada):
  throw new ApiError(`No se alcanzó el microservicio de búsqueda (${candidates.join(' / ')}). Revisa que backend :3001 esté arriba.`, 0);
}

export { BASE_URL };
