import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Botón flotante tuerca: abre el modal de configuraciones (selector de 5 estilos).
export function ThemeFab({ onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir configuración de estilo"
    >
      <Ionicons name="settings-sharp" size={26} color="#fff" />
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
