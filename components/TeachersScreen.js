import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeachers } from '../context/TeachersContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// Pantalla SIMPLE de docentes: lista de 3, sin tabs galeria/datos.
// Cada tarjeta tiene un BOTON "Ver informacion" (fuera de BottomTabs)
// que lleva a la vista detalle. Header de la app dice "Profesores".
export function TeachersScreen() {
  const { list, fetchList } = useTeachers();
  const { colors } = useTheme();

  useEffect(() => {
    if (list.length === 0) fetchList('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      {list.map((t) => (
        <TeacherCard key={t.id} teacher={t} />
      ))}
    </View>
  );
}

function TeacherCard({ teacher }) {
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%' },
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
});
