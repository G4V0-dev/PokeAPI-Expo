import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeachers } from '../context/TeachersContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// Vista detalle del docente: foto LinkedIn (o placeholder), profesion,
// descripcion de la red social + link al perfil. Boton "Volver" regresa
// a la lista. Este boton esta FUERA del BottomTabs, como se pidio.
export function TeacherDetailScreen() {
  const { selected, goBack } = useTeachers();
  const { colors } = useTheme();
  if (!selected) return null;

  const openProfile = () => {
    if (selected.profileUrl) Linking.openURL(selected.profileUrl).catch(() => {});
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Image
        style={styles.photo}
        source={{ uri: selected.photo }}
        accessibilityLabel={`Foto de ${selected.name}`}
      />
      <Text style={[styles.name, { color: colors.textDark }]}>{selected.name}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: 20, width: '100%', alignItems: 'center', gap: 8 },
  photo: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#eee' },
  name: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
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
});
