import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme/tokens';

// SearchBar genérico por props: lo alimenta el context del área activa
// (Pokemon o Naruto). `color` pinta el botón con el acento del área. Sin fetch interno.
export function SearchBar({ value, onChange, onSearch, color, placeholder, label }) {
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={COLORS.textMedium}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        accessibilityLabel={label}
      />
      <Pressable style={[styles.btn, { backgroundColor: color || COLORS.primary }]} onPress={onSearch} accessibilityRole="button" accessibilityLabel="Buscar">
        <Ionicons name="search" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', width: '100%', marginBottom: 16 },
  input: {
    flex: 1, height: 55, backgroundColor: COLORS.surface, fontSize: 16, color: COLORS.textDark,
    paddingHorizontal: 20, borderTopLeftRadius: RADIUS.l, borderBottomLeftRadius: RADIUS.l,
  },
  btn: {
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 25, borderTopRightRadius: RADIUS.l, borderBottomRightRadius: RADIUS.l, minHeight: 44,
  },
});
