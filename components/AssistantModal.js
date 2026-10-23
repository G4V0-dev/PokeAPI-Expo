import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme/tokens';
import { useAssistant } from '../context/AssistantContext';
import { useSettings } from '../context/SettingsContext';

// Preguntas de ejemplo cuando el hilo está vacío (solo temas del catálogo).
const SUGGESTIONS = [
  '¿Cuánto pesa Pikachu?',
  '¿Quién es Sasuke?',
  '¿Qué pokémon hay en el catálogo?',
  '¿Qué personajes de Naruto hay?',
];

function Bubble({ item }) {
  const isUser = item.role === 'user';
  const isError = item.role === 'error';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? COLORS.primary : COLORS.background,
            borderColor: isUser ? COLORS.primary : COLORS.border,
          },
          isError && { backgroundColor: COLORS.surface, borderColor: COLORS.liked },
        ]}
      >
        {isError && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.liked} />
            <Text style={styles.errorLabel}>Sin respuesta</Text>
          </View>
        )}
        <Text style={[styles.bubbleText, { color: isUser ? '#fff' : COLORS.textDark }]}>{item.text}</Text>
      </View>
    </View>
  );
}

// Chat del asistente IA: modal deslizante con hilo local de sesión.
// El servidor no guarda memoria: cada pregunta es independiente.
export function AssistantModal() {
  const { messages, loading, open, setOpen, send, clear } = useAssistant();
  const { aiProvider, providers, timeoutSeconds } = useSettings();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const providerName = providers.find((p) => p.id === aiProvider)?.name || aiProvider;

  const submit = (text) => {
    const t = String(text != null ? text : draft).trim();
    if (!t || loading) return;
    setDraft('');
    send(t);
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={22} color={COLORS.primary} />
            <Text style={styles.title}>Asistente IA</Text>
            {messages.length > 0 && (
              <Pressable
                onPress={clear}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Limpiar conversación"
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.textMedium} />
              </Pressable>
            )}
            <Pressable
              onPress={() => setOpen(false)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar asistente"
            >
              <Ionicons name="close" size={24} color={COLORS.textMedium} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Solo pokémon y personajes de Naruto · {providerName} · espera {timeoutSeconds} s
          </Text>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={({ item }) => <Bubble item={item} />}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (listRef.current && messages.length > 0) {
                listRef.current.scrollToEnd({ animated: true });
              }
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textMedium} />
                <Text style={styles.emptyText}>
                  Pregúntame por los pokémon o personajes de Naruto de la app.
                </Text>
                <View style={styles.chips}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      style={styles.chip}
                      onPress={() => submit(s)}
                      accessibilityRole="button"
                      accessibilityLabel={`Preguntar: ${s}`}
                    >
                      <Text style={styles.chipText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          />

          {loading && (
            <View style={styles.thinking}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.thinkingText}>
                Pensando con {providerName}… máx. {timeoutSeconds} s
              </Text>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe tu pregunta…"
              placeholderTextColor={COLORS.textMedium}
              maxLength={500}
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={() => submit()}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: draft.trim() && !loading ? COLORS.primary : COLORS.textMedium }]}
              onPress={() => submit()}
              disabled={!draft.trim() || loading}
              accessibilityRole="button"
              accessibilityLabel="Enviar pregunta"
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    height: '88%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: COLORS.textDark },
  iconBtn: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 12, fontWeight: '700', marginBottom: 8, color: COLORS.textMedium },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingVertical: 8 },
  row: { marginBottom: 10, flexDirection: 'row' },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: RADIUS.l,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  errorLabel: { fontSize: 12, fontWeight: '800', color: COLORS.liked },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 10, marginBottom: 16, color: COLORS.textMedium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 },
  thinkingText: { fontSize: 12, fontWeight: '600', flex: 1, color: COLORS.textMedium },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.l,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 10, color: COLORS.textDark },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
