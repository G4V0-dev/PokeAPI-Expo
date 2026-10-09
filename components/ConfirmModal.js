import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// ConfirmModal: confirmacion destructiva in-app (nativo + web).
// Se usa en vez de Alert.alert, que en Expo web no muestra dialogo y
// el borrado parecia "no funcionar". Solo confirma; la accion real
// (DELETE al micro en Render) la ejecuta el llamador via onConfirm.
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  confirming,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} accessibilityLabel={title}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="warning-outline" size={28} color="#B91C1C" />
          <Text style={[styles.title, { color: colors.textDark }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMedium }]}>{message}</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, { borderColor: colors.border }]}
              onPress={onCancel}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={[styles.btnText, { color: colors.textDark }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.danger, { opacity: confirming ? 0.7 : 1 }]}
              onPress={onConfirm}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.btnTextLight}>{confirming ? 'Borrando...' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderRadius: RADIUS.l, borderWidth: 1, padding: 20, gap: 8, width: '100%', maxWidth: 420, alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8, alignSelf: 'stretch' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 12, minHeight: 44 },
  danger: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },
  btnText: { fontWeight: '800', fontSize: 14 },
  btnTextLight: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
