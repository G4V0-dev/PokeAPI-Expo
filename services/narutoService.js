// Cliente del microservicio cloud Anime (DynamoDB vía Render, solo URLs públicas).
// Sin fallback local por decisión de escalamiento: todo va a la nube.
// El timeout (20/40/80/160 s) llega desde SettingsContext.
import { createTimeoutSignal, timeoutMessage } from './http';

const BASE_URL = process.env.EXPO_PUBLIC_NARUTO_API_URL || 'https://pokeapi-expo-naruto.onrender.com';

export class NarutoApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'NarutoApiError';
    this.status = status;
  }
}

export async function getNarutoCharacter(query, signal, timeoutMs) {
  let q = String(query || '').trim();
  if (!q) throw new NarutoApiError('Ingresa un nombre o número', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10)); // IDs: "01307" -> "1307"
  else q = q.toLowerCase();

  const timeout = createTimeoutSignal(signal, timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/characters/${encodeURIComponent(q)}`, { signal: timeout.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new NarutoApiError(
        body.detail || body.error || 'Personaje no encontrado en la nube (solo 10 disponibles).',
        res.status
      );
    }
    return body;
  } catch (e) {
    if (timeout.didTimeout()) {
      throw new NarutoApiError(timeoutMessage(timeoutMs, 'El microservicio cloud de Anime'), 408);
    }
    if (e?.name === 'AbortError' || e instanceof NarutoApiError) throw e;
    throw new NarutoApiError(
      `No se alcanzó el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  } finally {
    timeout.cleanup();
  }
}

export { BASE_URL as NARUTO_BASE_URL };
