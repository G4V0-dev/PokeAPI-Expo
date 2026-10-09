// Cliente del microservicio cloud Docentes (DynamoDB via Render, solo URLs publicas).
// Sin fallback local por decision de escalamiento: todo va a la nube.
// Lectura con path/query params; escrituras CRUD con body JSON.
// Sin BD el micro responde 503 con mensaje claro (ver server.js).
const BASE_URL = process.env.EXPO_PUBLIC_TEACHERS_API_URL || 'https://pokeapi-expo-profesores.onrender.com';

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

async function sendWrite(method, path, payload, signal) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
  } catch {
    throw new TeachersApiError(
      `No se alcanzo el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new TeachersApiError(body.error || `No se pudo completar ${method} ${path}.`, res.status);
  return body;
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
  if (!res.ok) throw new TeachersApiError(body.error || 'Docente no encontrado en la nube.', res.status);
  return body;
}

// --- CRUD (body JSON, escrituras abiertas sin auth por decision del proyecto) ---

export async function createTeacher(payload, signal) {
  return sendWrite('POST', '/teachers', payload, signal);
}

export async function updateTeacher(id, payload, signal) {
  const num = String(id || '').trim();
  if (!/^\d+$/.test(num)) throw new TeachersApiError('PUT requiere ID numerico.', 400);
  return sendWrite('PUT', `/teachers/${num}`, payload, signal);
}

export async function patchTeacher(id, payload, signal) {
  const num = String(id || '').trim();
  if (!/^\d+$/.test(num)) throw new TeachersApiError('PATCH requiere ID numerico.', 400);
  return sendWrite('PATCH', `/teachers/${num}`, payload, signal);
}

export async function deleteTeacher(id, signal) {
  const num = String(id || '').trim();
  if (!/^\d+$/.test(num)) throw new TeachersApiError('DELETE requiere ID numerico.', 400);
  let res;
  try {
    res = await fetch(`${BASE_URL}/teachers/${num}`, { method: 'DELETE', signal });
  } catch {
    throw new TeachersApiError(
      `No se alcanzo el microservicio cloud (${BASE_URL}). Render gratis puede tardar ~50s en despertar; reintenta.`,
      0
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new TeachersApiError(body.error || 'No se pudo borrar el docente.', res.status);
  return body;
}

export { BASE_URL as TEACHERS_BASE_URL };
