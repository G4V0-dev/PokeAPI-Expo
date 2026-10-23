import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSettings } from './SettingsContext';
import { askAssistant } from '../services/aiService';

const AssistantContext = createContext(null);

let uid = 0;
const nextId = () => {
  uid += 1;
  return uid;
};

/**
 * AssistantProvider: chat del asistente IA (botón flotante + modal).
 * - El proveedor y el timeout salen de SettingsContext en cada envío.
 * - Sin memoria en el servidor: cada mensaje es independiente.
 * - Burbujas con 3 roles: user | assistant | error (red/timeout/proveedor sin key).
 */
export function AssistantProvider({ children }) {
  const { aiProvider, timeoutMs } = useSettings();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);
  const requestRef = useRef(0);

  const send = useCallback(
    async (raw) => {
      const text = String(raw || '').trim();
      if (!text || loading) return;
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
      setLoading(true);
      try {
        const data = await askAssistant(text, {
          provider: aiProvider,
          timeoutMs,
          signal: ctrl.signal,
        });
        if (requestId !== requestRef.current) return;
        setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: data.reply }]);
      } catch (e) {
        if (requestId === requestRef.current && e?.name !== 'AbortError') {
          setMessages((prev) => [...prev, { id: nextId(), role: 'error', text: e.message || 'Error de red' }]);
        }
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [loading, aiProvider, timeoutMs],
  );

  const clear = useCallback(() => {
    requestRef.current += 1;
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ messages, loading, open, setOpen, send, clear }),
    [messages, loading, open, send, clear],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant debe usarse dentro de <AssistantProvider>');
  return ctx;
}
