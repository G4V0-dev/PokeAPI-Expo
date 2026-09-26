import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePokemon } from '../context/PokemonContext';
import { COLORS, RADIUS } from '../theme/tokens';

// Tabs estilo Paint/Stitch: 2 botones abajo, naranja/rojo = activa.
export function BottomTabs() {
  const { activeTab, setActiveTab } = usePokemon();
  const galeria = activeTab === 'galeria';
  return (
    <View style={styles.bar}>
      <Pressable
        style={[styles.tab, galeria && styles.tabActive]}
        onPress={() => setActiveTab('galeria')}
        accessibilityRole="button"
        accessibilityLabel="Ver galeria"
        accessibilityState={{ selected: galeria }}
      >
        <Ionicons name="grid" size={18} color={galeria ? '#fff' : COLORS.textDark} />
        <Text style={[styles.label, galeria && styles.labelActive]}>Galería</Text>
      </Pressable>
      <Pressable
        style={[styles.tab, !galeria && styles.tabActive]}
        onPress={() => setActiveTab('datos')}
        accessibilityRole="button"
        accessibilityLabel="Ver datos"
        accessibilityState={{ selected: !galeria }}
      >
        <Ionicons name="list" size={18} color={!galeria ? '#fff' : COLORS.textDark} />
        <Text style={[styles.label, !galeria && styles.labelActive]}>Datos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  tab: {
    flex: 1, minHeight: 48, borderRadius: RADIUS.m, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  labelActive: { color: '#fff' },
});
