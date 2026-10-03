// Cliente del microservicio cloud Docentes (DynamoDB via Render, solo URLs publicas).
// Sin fallback local por decision de escalamiento: todo va a la nube.
// Solo path/query params, nunca body.
const BASE_URL = process.env.EXPO_PUBLIC_TEACHERS_API_URL || 'https://pokeapi-expo-teachers.onrender.com';

export class TeachersApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'TeachersApiError';
    this.status = status;
  }
}

async function fetchJson(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch {
    throw new TeachersApiError(
      `No se alcanzo el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  }
  return res;
}

export async function getTeachers(signal, query) {
  const q = String(query || '').trim();
  const url = q
    ? `${BASE_URL}/teachers?query=${encodeURIComponent(q)}`
    : `${BASE_URL}/teachers`;
  const res = await fetchJson(url, signal);
  const body = await res.json().catch(() => []);
  if (!res.ok) throw new TeachersApiError(body.error || 'No se pudo listar los docentes.', res.status);
  return body;
}

export async function getTeacher(query, signal) {
  let q = String(query || '').trim();
  if (!q) throw new TeachersApiError('Ingresa un nombre o numero', 400);
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10));
  else q = q.toLowerCase();
  const res = await fetchJson(`${BASE_URL}/teachers/${encodeURIComponent(q)}`, signal);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new TeachersApiError(body.error || 'Docente no encontrado en la nube (solo 3 disponibles).', res.status);
  return body;
}

export { BASE_URL as TEACHERS_BASE_URL };
