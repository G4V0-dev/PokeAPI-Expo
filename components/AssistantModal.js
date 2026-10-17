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
import { RADIUS } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';
import { useAssistant } from '../context/AssistantContext';

// Preguntas de ejemplo cuando el hilo está vacío (solo temas del catálogo).
const SUGGESTIONS = [
  '¿Cuánto pesa Pikachu?',
  '¿Quién es Sasuke?',
  '¿Qué docentes hay registrados?',
  '¿Qué pokémon hay en el catálogo?',
];

function Bubble({ item, colors }) {
  const isUser = item.role === 'user';
  const isError = item.role === 'error';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.background,
            borderColor: isUser ? colors.primary : colors.border,
          },
          isError && { backgroundColor: colors.surface, borderColor: colors.liked },
        ]}
      >
        {isError && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={colors.liked} />
            <Text style={[styles.errorLabel, { color: colors.liked }]}>Sin respuesta</Text>
          </View>
        )}
        <Text style={[styles.bubbleText, { color: isUser ? '#fff' : colors.textDark }]}>{item.text}</Text>
      </View>
    </View>
  );
}

// Chat del asistente IA: modal deslizante con hilo local de sesión.
// El servidor no guarda memoria: cada pregunta es independiente.
export function AssistantModal() {
  const { colors } = useTheme();
  const { messages, loading, open, setOpen, send, clear } = useAssistant();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  const submit = (text) => {
    const t = String(text != null ? text : draft).trim();
    if (!t || loading) return;
    setDraft('');
    send(t);
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textDark }]}>Asistente IA</Text>
            {messages.length > 0 && (
              <Pressable
                onPress={clear}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Limpiar conversación"
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={20} color={colors.textMedium} />
              </Pressable>
            )}
            <Pressable
              onPress={() => setOpen(false)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar asistente"
            >
              <Ionicons name="close" size={24} color={colors.textMedium} />
            </Pressable>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMedium }]}>
            Solo pokémon, personajes de Naruto y docentes · cada pregunta es independiente
          </Text>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={({ item }) => <Bubble item={item} colors={colors} />}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => {
              if (listRef.current) listRef.current.scrollToEnd({ animated: true });
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMedium} />
                <Text style={[styles.emptyText, { color: colors.textMedium }]}>
                  Pregúntame por los pokémon, personajes de Naruto o docentes de la app.
                </Text>
                <View style={styles.chips}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => submit(s)}
                      accessibilityRole="button"
                      accessibilityLabel={`Preguntar: ${s}`}
                    >
                      <Text style={[styles.chipText, { color: colors.textDark }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          />

          {loading && (
            <View style={styles.thinking}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.thinkingText, { color: colors.textMedium }]}>
                Pensando… si la nube está dormida puede tardar ~50s
              </Text>
            </View>
          )}

          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, { color: colors.textDark }]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe tu pregunta…"
              placeholderTextColor={colors.textMedium}
              maxLength={500}
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={() => submit()}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: draft.trim() && !loading ? colors.primary : colors.textMedium }]}
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
    borderTopWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 19, fontWeight: '800' },
  iconBtn: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
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
  errorLabel: { fontSize: 12, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 10, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { borderRadius: RADIUS.xl, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 40, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '700' },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 },
  thinkingText: { fontSize: 12, fontWeight: '600', flex: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.l,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 10 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
