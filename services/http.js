// Utilidad compartida por los servicios: combina la señal de cancelación del
// Context (nueva búsqueda) con el tiempo de espera parametrizado en Ajustes.
export const DEFAULT_TIMEOUT_MS = 40000;

export function createTimeoutSignal(externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let timedOut = false;
  const ms = Math.max(1, Number(timeoutMs) || DEFAULT_TIMEOUT_MS);
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);

  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener?.('abort', onAbort);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.('abort', onAbort);
    },
  };
}

export function timeoutMessage(timeoutMs, subject = 'El backend') {
  const seconds = Math.round((Number(timeoutMs) || DEFAULT_TIMEOUT_MS) / 1000);
  return `${subject} no respondió en ${seconds} s. Sube el tiempo de espera en Ajustes o reintenta.`;
}
