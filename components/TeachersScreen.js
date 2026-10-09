import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeachers } from '../context/TeachersContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';
import { TeacherForm } from './TeacherForm';
import { ConfirmModal } from './ConfirmModal';

// Pantalla SIMPLE de docentes: lista + admin CRUD (crear/borrar).
// Editar vive en el detalle. Cada tarjeta tiene BOTON "Ver informacion"
// (fuera de BottomTabs) que lleva a la vista detalle. Header dice "Profesores".
export function TeachersScreen() {
  const { list, fetchList, formMode, saving, startCreate, cancelForm, submitForm, removeTeacher } = useTeachers();
  const { colors } = useTheme();
  // Docente pendiente de borrado (solo confirmacion local; el DELETE real
  // lo ejecuta removeTeacher contra el micro en Render).
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (list.length === 0 && !formMode) fetchList('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (formMode === 'create') {
    return (
      <View style={styles.wrap}>
        <TeacherForm initial={null} saving={saving} onSubmit={submitForm} onCancel={cancelForm} />
      </View>
    );
  }

  const doDelete = async () => {
    if (!pendingDelete) return;
    await removeTeacher(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text style={[styles.count, { color: colors.textMedium }]}>{list.length} docentes en la nube</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={startCreate}
          accessibilityRole="button"
          accessibilityLabel="Agregar docente"
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.addText}>Agregar</Text>
        </Pressable>
      </View>
      {list.map((t) => (
        <TeacherCard key={t.id} teacher={t} onDelete={() => setPendingDelete(t)} deleting={saving && pendingDelete?.id === t.id} />
      ))}
      <ConfirmModal
        visible={!!pendingDelete}
        title="Borrar docente"
        message={pendingDelete ? `¿Borrar a ${pendingDelete.name} (#${pendingDelete.id})? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Borrar"
        confirming={saving}
        onConfirm={doDelete}
        onCancel={() => { if (!saving) setPendingDelete(null); }}
      />
    </View>
  );
}

function TeacherCard({ teacher, onDelete, deleting }) {
  const { openDetail } = useTeachers();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image
        style={styles.photo}
        source={{ uri: teacher.photo }}
        accessibilityLabel={`Foto de ${teacher.name}`}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textDark }]}>{teacher.name}</Text>
        <Text style={[styles.prof, { color: colors.textMedium }]} numberOfLines={2}>
          {teacher.profession}
        </Text>
        {/* BOTON fuera del BottomTabs: abre la vista detalle */}
        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => openDetail(teacher)}
          accessibilityRole="button"
          accessibilityLabel={`Ver informacion de ${teacher.name}`}
        >
          <Ionicons name="person-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Ver información</Text>
        </Pressable>
        <Pressable
          style={[styles.deleteBtn, { borderColor: colors.border, opacity: deleting ? 0.7 : 1 }]}
          onPress={onDelete}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel={`Borrar a ${teacher.name}`}
        >
          <Ionicons name="trash-outline" size={16} color="#B91C1C" />
          <Text style={styles.deleteText}>{deleting ? 'Borrando...' : 'Borrar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 13, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 14, minHeight: 44 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  card: {
    flexDirection: 'row', gap: 12, padding: 12,
    borderRadius: RADIUS.l, borderWidth: 1, alignItems: 'center',
  },
  photo: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '800' },
  prof: { fontSize: 13, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: RADIUS.m, paddingVertical: 10, paddingHorizontal: 14, marginTop: 6, minHeight: 44,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: RADIUS.m, paddingVertical: 8, paddingHorizontal: 14, marginTop: 6, minHeight: 40,
  },
  deleteText: { color: '#B91C1C', fontWeight: '800', fontSize: 13 },
});
