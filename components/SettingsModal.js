import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme/tokens';
import { useSettings } from '../context/SettingsContext';

// Modal de parámetros de ejecución: timeout del backend y proveedor de IA.
// Solo sesión (sin AsyncStorage): al reiniciar vuelven los valores por defecto.
export function SettingsModal({ visible, onClose }) {
  const {
    timeoutMs,
    setTimeoutMs,
    timeoutOptions,
    aiProvider,
    setAiProvider,
    providers,
  } = useSettings();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Ionicons name="settings-sharp" size={22} color={COLORS.primary} />
            <Text style={styles.title}>Parámetros</Text>
            <Pressable
              onPress={onClose}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Cerrar parámetros"
            >
              <Ionicons name="close" size={24} color={COLORS.textMedium} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.section}>Tiempo de espera del backend</Text>
            <Text style={styles.help}>Aplica a Pokémon, Naruto y Asistente IA.</Text>
            <View style={styles.timeoutRow}>
              {timeoutOptions.map((ms) => {
                const active = ms === timeoutMs;
                return (
                  <Pressable
                    key={ms}
                    style={[styles.timeoutChip, active && styles.optionActive]}
                    onPress={() => setTimeoutMs(ms)}
                    accessibilityRole="button"
                    accessibilityLabel={`Esperar ${ms / 1000} segundos`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.timeoutText, active && styles.optionTextActive]}>
                      {ms / 1000} s
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.section, styles.sectionSpaced]}>Servicio de inteligencia artificial</Text>
            <Text style={styles.help}>El front elige el proveedor; las API keys viven solo en el backend.</Text>
            <View style={styles.providerList}>
              {providers.map((p) => {
                const active = p.id === aiProvider;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.provider, active && styles.optionActive]}
                    onPress={() => setAiProvider(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar ${p.name} como proveedor de IA`}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.providerTexts}>
                      <Text style={[styles.providerName, active && styles.optionTextActive]}>{p.name}</Text>
                      <Text style={styles.providerDesc}>{p.description}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.textMedium} />
              <Text style={styles.noteText}>
                Sin persistencia: al reiniciar la app vuelven 40 s y Gemini. Si falta la API key del
                proveedor en backend-ai/.env, el chat mostrará un error claro.
              </Text>
            </View>
          </ScrollView>

          <Pressable style={styles.cta} onPress={onClose} accessibilityRole="button" accessibilityLabel="Listo">
            <Text style={styles.ctaText}>Listo</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: COLORS.textDark },
  close: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 8, paddingBottom: 12 },
  section: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  sectionSpaced: { marginTop: 22 },
  help: { fontSize: 12, fontWeight: '600', color: COLORS.textMedium, marginTop: 4, marginBottom: 10 },
  timeoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeoutChip: {
    flex: 1,
    minWidth: 68,
    minHeight: 46,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeoutText: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
  providerList: { gap: 8 },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: 12,
    minHeight: 56,
  },
  providerTexts: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
  providerDesc: { fontSize: 12, fontWeight: '600', color: COLORS.textMedium, marginTop: 2 },
  optionActive: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.surface },
  optionTextActive: { color: COLORS.primary },
  note: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    padding: 12,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17, color: COLORS.textMedium },
  cta: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.m,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
