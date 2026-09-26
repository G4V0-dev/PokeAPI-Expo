import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePokemon } from '../context/PokemonContext';
import { COLORS, RADIUS } from '../theme/tokens';

export function SearchBar() {
  const { query, setQuery, search } = usePokemon();
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Ej. pikachu, 25, charizard"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={COLORS.textMedium}
        onSubmitEditing={search}
        returnKeyType="search"
        accessibilityLabel="Buscar pokemon por nombre o número"
      />
      <Pressable style={styles.btn} onPress={search} accessibilityRole="button" accessibilityLabel="Buscar">
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
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 25, borderTopRightRadius: RADIUS.l, borderBottomRightRadius: RADIUS.l, minHeight: 44,
  },
});
