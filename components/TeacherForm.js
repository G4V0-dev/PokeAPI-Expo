import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// Formulario admin Crear/Editar docente (StyleSheet.create, sin libs externas).
// `initial` trae detalle existente en modo edit; en create viene null.
// Llama onSubmit(payload) con body plano para POST/PUT del micro.
export function TeacherForm({ initial, saving, onSubmit, onCancel }) {
  const { colors } = useTheme();
  const [name, setName] = useState(initial?.name || '');
  const [profession, setProfession] = useState(initial?.profession || '');
  const [headline, setHeadline] = useState(initial?.headline || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [photo, setPhoto] = useState(initial?.photo || '');
  const [profileUrl, setProfileUrl] = useState(initial?.profileUrl || '');
  const [area, setArea] = useState(initial?.area || '');
  const [aliases, setAliases] = useState(
    Array.isArray(initial?.aliases) ? initial.aliases.join(', ') : ''
  );
  const [localError, setLocalError] = useState(null);

  const submit = () => {
    if (!name.trim() || !profession.trim()) {
      setLocalError('Nombre y profesión son obligatorios.');
      return;
    }
    setLocalError(null);
    onSubmit({
      name: name.trim(),
      profession: profession.trim(),
      headline: headline.trim(),
      description: description.trim(),
      photo: photo.trim(),
      profileUrl: profileUrl.trim(),
      area: area.trim(),
      aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
    });
  };

  const fieldStyle = (extra) => [
    styles.input,
    { backgroundColor: colors.background, borderColor: colors.border, color: colors.textDark },
    extra,
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textDark }]}>
        {initial?.id ? `Editar docente #${initial.id}` : 'Agregar docente'}
      </Text>

      <Text style={[styles.label, { color: colors.textMedium }]}>Nombre *</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Ej. Ada Lovelace" placeholderTextColor={colors.textMedium} style={fieldStyle()} accessibilityLabel="Nombre del docente" />

      <Text style={[styles.label, { color: colors.textMedium }]}>Profesión *</Text>
      <TextInput value={profession} onChangeText={setProfession} placeholder="Ej. Docente de Programación" placeholderTextColor={colors.textMedium} style={fieldStyle()} accessibilityLabel="Profesión del docente" />

      <Text style={[styles.label, { color: colors.textMedium }]}>Headline</Text>
      <TextInput value={headline} onChangeText={setHeadline} placeholder="Resumen corto" placeholderTextColor={colors.textMedium} style={fieldStyle()} accessibilityLabel="Headline" />

      <Text style={[styles.label, { color: colors.textMedium }]}>Descripción</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Biografía / experiencia" placeholderTextColor={colors.textMedium} multiline numberOfLines={4} textAlignVertical="top" style={fieldStyle({ minHeight: 90 })} accessibilityLabel="Descripción" />

      <Text style={[styles.label, { color: colors.textMedium }]}>Foto (URL)</Text>
      <TextInput value={photo} onChangeText={setPhoto} placeholder="https://..." placeholderTextColor={colors.textMedium} autoCapitalize="none" style={fieldStyle()} accessibilityLabel="URL de foto" />

      <Text style={[styles.label, { color: colors.textMedium }]}>LinkedIn (URL)</Text>
      <TextInput value={profileUrl} onChangeText={setProfileUrl} placeholder="https://www.linkedin.com/in/..." placeholderTextColor={colors.textMedium} autoCapitalize="none" style={fieldStyle()} accessibilityLabel="URL de perfil" />

      <Text style={[styles.label, { color: colors.textMedium }]}>Área</Text>
      <TextInput value={area} onChangeText={setArea} placeholder="Ej. Ingeniería de Software" placeholderTextColor={colors.textMedium} style={fieldStyle()} accessibilityLabel="Área" />

      <Text style={[styles.label, { color: colors.textMedium }]}>Alias (coma)</Text>
      <TextInput value={aliases} onChangeText={setAliases} placeholder="Ej. ada, lovelace" placeholderTextColor={colors.textMedium} autoCapitalize="none" style={fieldStyle()} accessibilityLabel="Alias separados por coma" />

      {localError ? <Text style={styles.localError}>{localError}</Text> : null}

      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.cancel, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Cancelar formulario"
        >
          <Text style={[styles.btnText, { color: colors.textDark }]}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={submit}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar docente"
        >
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.btnTextLight}>{saving ? 'Guardando...' : 'Guardar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.l, borderWidth: 1, padding: 16, gap: 6, width: '100%' },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  input: { borderWidth: 1, borderRadius: RADIUS.m, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 44 },
  localError: { color: '#B91C1C', fontWeight: '700', fontSize: 13, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: RADIUS.m, paddingVertical: 12, minHeight: 44 },
  cancel: { borderWidth: 1, backgroundColor: 'transparent' },
  btnText: { fontWeight: '800', fontSize: 14 },
  btnTextLight: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
