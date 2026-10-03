import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RADIUS } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';

export function EmptyState({ message }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.surface }]}>
      <MaterialCommunityIcons name="pokeball" size={44} color={colors.primary} />
      <Text style={[styles.text, { color: colors.textMedium }]}>{message || 'Busca un Pokémon para ver la galería y los datos'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: RADIUS.xl, padding: 28, alignItems: 'center', gap: 12, width: '100%' },
  text: { fontSize: 15, textAlign: 'center', fontWeight: '600' },
});
