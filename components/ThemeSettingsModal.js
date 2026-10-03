import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';

// Modal de configuraciones: lista los 5 estilos con preview de paleta.
// Solo colores (mismo layout/radios). Sin persistencia: estado en memoria.
export function ThemeSettingsModal({ visible, onClose }) {
  const { themeId, setThemeId, themes, colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Ionicons name="settings-sharp" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textDark }]}>Configuración</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Cerrar configuración">
              <Ionicons name="close" size={24} color={colors.textMedium} />
            </Pressable>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMedium }]}>Estilo de color · 5 paletas</Text>

          {themes.map((t) => {
            const active = t.id === themeId;
            return (
              <Pressable
                key={t.id}
                style={[
                  styles.option,
                  { backgroundColor: colors.background, borderColor: active ? colors.primary : colors.border },
                  active && { borderWidth: 2 },
                ]}
                onPress={() => setThemeId(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`Usar estilo ${t.name}`}
                accessibilityState={{ selected: active }}
              >
                <View style={styles.dots}>
                  <View style={[styles.dot, { backgroundColor: t.colors.primary }]} />
                  <View style={[styles.dot, { backgroundColor: t.narutoPrimary }]} />
                  <View style={[styles.dot, { backgroundColor: t.colors.secondary }]} />
                  <View style={[styles.dot, { backgroundColor: t.colors.background, borderColor: t.colors.border }]} />
                </View>
                <View style={styles.texts}>
                  <Text style={[styles.name, { color: colors.textDark }]}>{t.name}</Text>
                  <Text style={[styles.desc, { color: colors.textMedium }]}>{t.description}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </Pressable>
            );
          })}

          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Listo"
          >
            <Text style={styles.ctaText}>Listo</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 20, borderTopWidth: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 19, fontWeight: '800' },
  close: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: RADIUS.l, padding: 12, marginBottom: 10, borderWidth: 1 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  texts: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' },
  desc: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cta: { borderRadius: RADIUS.m, paddingVertical: 14, alignItems: 'center', marginTop: 6, minHeight: 48, justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
