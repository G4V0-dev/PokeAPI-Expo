import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme/tokens';

export function EmptyState({ message }) {
  return (
    <View style={styles.box}>
      <MaterialCommunityIcons name="pokeball" size={44} color={COLORS.primary} />
      <Text style={styles.text}>{message || 'Busca un Pokémon para ver la galería y los datos'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 28, alignItems: 'center', gap: 12, width: '100%' },
  text: { fontSize: 15, color: COLORS.textMedium, textAlign: 'center', fontWeight: '600' },
});
