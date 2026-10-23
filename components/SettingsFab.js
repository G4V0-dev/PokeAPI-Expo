import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Botón flotante de parámetros (timeout del backend + proveedor de IA).
export function SettingsFab({ onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[
        styles.fab,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir ajustes de timeout y proveedor de IA"
    >
      <Ionicons name="settings-sharp" size={22} color={colors.textDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 164,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 49,
  },
});
