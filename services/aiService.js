// Cliente del microservicio cloud Asistente IA (Gemini vía Render, solo URL pública).
// Sin fallback local por decisión de escalamiento: todo va a la nube.
// Sin memoria en el servidor: cada mensaje es independiente (no se envía historial).
const BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'https://pokeapi-expo-asistente.onrender.com';

export class AiApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AiApiError';
    this.status = status;
  }
}

export async function askAssistant(message, signal) {
  const text = String(message || '').trim();
  if (!text) throw new AiApiError('Escribe una pregunta.', 400);
  if (text.length > 500) throw new AiApiError('La pregunta supera 500 caracteres.', 400);
  let res;
  try {
    res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
  } catch {
    throw new AiApiError(
      `No se alcanzó el asistente (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiApiError(body.error || 'El asistente no pudo responder.', res.status);
  return body;
}

export { BASE_URL as AI_BASE_URL };
