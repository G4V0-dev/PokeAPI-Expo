// Cliente del microservicio de IA. El proveedor (gemini/openai/deepseek) y el
// timeout viajan desde SettingsContext; las API keys nunca salen del backend.
import { createTimeoutSignal, timeoutMessage } from './http';

const BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'http://localhost:3004';

const PROVIDER_LABELS = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
};

export class AiApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AiApiError';
    this.status = status;
  }
}

export async function askAssistant(message, { provider = 'gemini', timeoutMs, signal } = {}) {
  const text = String(message || '').trim();
  if (!text) throw new AiApiError('Escribe una pregunta.', 400);
  if (text.length > 500) throw new AiApiError('La pregunta supera 500 caracteres.', 400);

  const label = PROVIDER_LABELS[provider] || provider;
  const timeout = createTimeoutSignal(signal, timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      signal: timeout.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, provider, timeoutMs }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new AiApiError(body.error || `${label} no pudo responder.`, res.status);
    if (!body.reply) throw new AiApiError('El asistente devolvió una respuesta vacía.', 502);
    return body;
  } catch (e) {
    if (timeout.didTimeout()) throw new AiApiError(timeoutMessage(timeoutMs, 'El asistente IA'), 408);
    if (e?.name === 'AbortError' || e instanceof AiApiError) throw e;
    throw new AiApiError(
      `No se alcanzó el asistente (${BASE_URL}). Revisa que backend-ai esté corriendo en :3004.`,
      0,
    );
  } finally {
    timeout.cleanup();
  }
}

export { BASE_URL as AI_BASE_URL };
