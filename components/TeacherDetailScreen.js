import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeachers } from '../context/TeachersContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';
import { TeacherForm } from './TeacherForm';
import { ConfirmModal } from './ConfirmModal';

// Vista detalle del docente + admin CRUD (editar/borrar).
// En modo edit muestra el formulario; si no, foto, profesion,
// descripcion + link al perfil. Boton "Volver" regresa a la lista.
export function TeacherDetailScreen() {
  const { selected, goBack, formMode, saving, startEdit, cancelForm, submitForm, removeTeacher, newIds } = useTeachers();
  const { colors } = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (!selected && formMode !== 'edit') return null;

  if (formMode === 'edit' && selected) {
    return (
      <View style={styles.wrap}>
        <TeacherForm initial={selected} saving={saving} onSubmit={submitForm} onCancel={cancelForm} />
      </View>
    );
  }
  if (!selected) return null;

  const openProfile = () => {
    if (selected.profileUrl) Linking.openURL(selected.profileUrl).catch(() => {});
  };

  const confirmDelete = () => setConfirmingDelete(true);

  const doDelete = async () => {
    if (!selected) return;
    await removeTeacher(selected.id);
    setConfirmingDelete(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Image
        style={styles.photo}
        source={{ uri: selected.photo }}
        accessibilityLabel={`Foto de ${selected.name}`}
      />
      <Text style={[styles.name, { color: colors.textDark }]}>{selected.name}</Text>
      {newIds.some((v) => String(v) === String(selected.id)) ? (
        <View style={styles.newPill}>
          <Text style={styles.newPillText}>NUEVO EN LA NUBE</Text>
        </View>
      ) : null}
      <Text style={[styles.prof, { color: colors.primary }]}>{selected.profession}</Text>
      {selected.headline ? (
        <Text style={[styles.headline, { color: colors.textMedium }]}>{selected.headline}</Text>
      ) : null}
      <Text style={[styles.desc, { color: colors.textDark }]}>{selected.description}</Text>

      {selected.profileUrl ? (
        <Pressable
          style={[styles.linkBtn, { borderColor: colors.primary }]}
          onPress={openProfile}
          accessibilityRole="link"
          accessibilityLabel="Abrir perfil de LinkedIn"
        >
          <Ionicons name="logo-linkedin" size={18} color={colors.primary} />
          <Text style={[styles.linkText, { color: colors.primary }]}>Ver perfil de LinkedIn</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.back, { backgroundColor: colors.primary }]}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Volver a docentes"
      >
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.backText}>Volver</Text>
      </Pressable>

      <View style={styles.adminRow}>
        <Pressable
          style={[styles.adminBtn, { borderColor: colors.primary }]}
          onPress={() => startEdit(selected)}
          accessibilityRole="button"
          accessibilityLabel="Editar docente"
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={[styles.adminBtnText, { color: colors.primary }]}>Editar</Text>
        </Pressable>
        <Pressable
          style={[styles.adminBtn, { borderColor: '#B91C1C', opacity: saving ? 0.7 : 1 }]}
          onPress={confirmDelete}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Borrar docente"
        >
          <Ionicons name="trash-outline" size={18} color="#B91C1C" />
          <Text style={[styles.adminBtnText, { color: '#B91C1C' }]}>{saving ? 'Borrando...' : 'Eliminar'}</Text>
        </Pressable>
      </View>
      <ConfirmModal
        visible={confirmingDelete}
        title="Borrar docente"
        message={`¿Borrar a ${selected.name} (#${selected.id})? Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        confirming={saving}
        onConfirm={doDelete}
        onCancel={() => { if (!saving) setConfirmingDelete(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  card: { borderRadius: RADIUS.xl, padding: 20, width: '100%', alignItems: 'center', gap: 8 },
  photo: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#eee' },
  name: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  newPill: { backgroundColor: '#D64545', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 12 },
  newPillText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  prof: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  headline: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  desc: { fontSize: 14, lineHeight: 20, textAlign: 'left', marginTop: 8 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 16, marginTop: 10, minHeight: 44,
  },
  linkText: { fontWeight: '800', fontSize: 14 },
  back: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: RADIUS.m, paddingVertical: 12, paddingHorizontal: 20, marginTop: 12, minHeight: 44, alignSelf: 'stretch',
  },
  backText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  adminRow: { flexDirection: 'row', gap: 10, marginTop: 4, alignSelf: 'stretch' },
  adminBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 12, minHeight: 44,
  },
  adminBtnText: { fontWeight: '800', fontSize: 14 },
});
