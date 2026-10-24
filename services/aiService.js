// Cliente del microservicio cloud Asistente IA (Gemini/Groq/DeepSeek vía Render).
// Sin fallback local por decisión de escalamiento: todo va a la nube.
// Sin memoria en el servidor: cada mensaje es independiente (no se envía historial).
import { createTimeoutSignal, timeoutMessage } from './http';

const BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'https://pokeapi-expo-ia.onrender.com';

export class AiApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AiApiError';
    this.status = status;
  }
}

export async function askAssistant(message, { provider, timeoutMs, signal } = {}) {
  const text = String(message || '').trim();
  if (!text) throw new AiApiError('Escribe una pregunta.', 400);
  if (text.length > 500) throw new AiApiError('La pregunta supera 500 caracteres.', 400);

  const timeout = createTimeoutSignal(signal, timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      signal: timeout.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, provider }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new AiApiError(body.error || 'El asistente no pudo responder.', res.status);
    return body;
  } catch (e) {
    if (timeout.didTimeout()) {
      throw new AiApiError(timeoutMessage(timeoutMs, 'El asistente IA'), 408);
    }
    if (e?.name === 'AbortError' || e instanceof AiApiError) throw e;
    throw new AiApiError(
      `No se alcanzó el asistente (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  } finally {
    timeout.cleanup();
  }
}

export { BASE_URL as AI_BASE_URL };
