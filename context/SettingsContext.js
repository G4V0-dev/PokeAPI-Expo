import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_TIMEOUT_MS } from '../services/http';

const SettingsContext = createContext(null);

// Valores permitidos por el requisito: 20/40/80/160 segundos.
export { DEFAULT_TIMEOUT_MS };
export const TIMEOUT_OPTIONS = [20000, 40000, 80000, 160000];

// Proveedores soportados por backend-ai. La API key vive solo en el backend.
export const AI_PROVIDERS = [
  { id: 'gemini', name: 'Gemini', description: 'Google AI Studio' },
  { id: 'openai', name: 'OpenAI', description: 'API de ChatGPT' },
  { id: 'deepseek', name: 'DeepSeek', description: 'API compatible con OpenAI' },
];
export const DEFAULT_AI_PROVIDER = 'gemini';

/**
 * SettingsProvider: parámetros de ejecución elegidos desde el front.
 * - timeoutMs: espera máxima de CUALQUIER llamada al backend.
 * - aiProvider: proveedor que backend-ai usará para el chat.
 * Sin persistencia (decisión del proyecto): al reiniciar vuelven los defaults.
 */
export function SettingsProvider({ children }) {
  const [timeoutMs, setTimeoutMs] = useState(DEFAULT_TIMEOUT_MS);
  const [aiProvider, setAiProvider] = useState(DEFAULT_AI_PROVIDER);

  const value = useMemo(
    () => ({
      timeoutMs,
      timeoutSeconds: timeoutMs / 1000,
      setTimeoutMs,
      timeoutOptions: TIMEOUT_OPTIONS,
      aiProvider,
      setAiProvider,
      providers: AI_PROVIDERS,
    }),
    [timeoutMs, aiProvider],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return ctx;
}
