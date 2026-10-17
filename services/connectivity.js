// Detección de conectividad (NetInfo) + clasificador de error de red.
// SDK 54: @react-native-community/netinfo incluido en Expo Go.
// Regla: offline SOLO si isConnected === false o isInternetReachable === false.
// isInternetReachable puede ser null en algunos Android -> se trata como online
// si isConnected !== false (evita falsos offline).
import NetInfo from '@react-native-community/netinfo';

export function isOnlineState(state) {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    return isOnlineState(state);
  } catch {
    // Si NetInfo falla, no bloquear al usuario: intentar red directo.
    return true;
  }
}

export function subscribeConnectivity(cb) {
  return NetInfo.addEventListener((state) => {
    cb(isOnlineState(state), state);
  });
}

// ¿El error es "sin red" (encolar) o "la nube respondió" (mostrar)?
// teachersService lanza TeachersApiError(status 0) ante fetch que no alcanza
// el micro (modo avión, sin wifi, timeout). Ese + TypeError/Network son red.
export function isNetworkError(e) {
  if (!e) return false;
  if (e.status === 0) return true;
  const msg = String(e.message || e.detail || '');
  return (
    /No se alcanzo el microservicio/i.test(msg) ||
    /No se alcanzó el microservicio/i.test(msg) ||
    /Network request failed/i.test(msg) ||
    /Failed to fetch/i.test(msg) ||
    /timeout|timed out|abort/i.test(msg) ||
    e.name === 'TypeError'
  );
}

// ¿La nube falló de forma transitoria (reintentar) o definitiva (no reintentar)?
// Retriable: red, 429, 5xx (incluye 503 sin DynamoDB y Render dormido).
// Definitivo: 400 (validación), 403 (IAM), 405. El 404 se trata por operación.
export function isRetriableStatus(status) {
  if (status === 0 || status == null) return true;
  if (status === 429) return true;
  return status >= 500 && status <= 599;
}

export function isValidationError(e) {
  return e && (e.status === 400 || e.status === 403 || e.status === 405);
}
