import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Botón flotante del asistente IA: abre el modal de chat sobre cualquier tab.
export function AssistantFab({ onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir asistente IA"
    >
      <Ionicons name="sparkles" size={26} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 50,
  },
});
