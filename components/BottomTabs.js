import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePokemon } from '../context/PokemonContext';
import { useNaruto } from '../context/NarutoContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// 4 tabs: Galería/Datos de Pokémon + Galería/Datos de Naruto.
// El área activa la maneja Home; cada tab fija área + tab interna de su context.
export function BottomTabs({ area, setArea }) {
  const poke = usePokemon();
  const naru = useNaruto();
  const { colors, narutoColors } = useTheme();
  const go = (nextArea, tab) => {
    setArea(nextArea);
    (nextArea === 'pokemon' ? poke : naru).setActiveTab(tab);
  };
  const tabs = [
    { key: 'poke-galeria', area: 'pokemon', label: 'Galería', icon: 'grid', active: area === 'pokemon' && poke.activeTab === 'galeria', onPress: () => go('pokemon', 'galeria') },
    { key: 'poke-datos', area: 'pokemon', label: 'Datos', icon: 'list', active: area === 'pokemon' && poke.activeTab === 'datos', onPress: () => go('pokemon', 'datos') },
    { key: 'naru-galeria', area: 'naruto', label: 'N-Galería', icon: 'image', active: area === 'naruto' && naru.activeTab === 'galeria', onPress: () => go('naruto', 'galeria') },
    { key: 'naru-datos', area: 'naruto', label: 'N-Datos', icon: 'book', active: area === 'naruto' && naru.activeTab === 'datos', onPress: () => go('naruto', 'datos') },
  ];
  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {tabs.map((t) => {
        const accent = t.area === 'naruto' ? narutoColors.primary : colors.primary;
        return (
          <Pressable
            key={t.key}
            style={[
              styles.tab,
              { backgroundColor: colors.background, borderColor: colors.border },
              t.active && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={t.onPress}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: t.active }}
          >
            <Ionicons name={t.icon} size={16} color={t.active ? '#fff' : colors.textDark} />
            <Text style={[styles.label, { color: colors.textDark }, t.active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1 },
  tab: {
    flex: 1, minHeight: 48, borderRadius: RADIUS.m, alignItems: 'center',
    justifyContent: 'center', gap: 2, borderWidth: 1,
  },
  label: { fontSize: 11, fontWeight: '700' },
  labelActive: { color: '#fff' },
});
