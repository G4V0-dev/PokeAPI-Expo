import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Entrada de la app: Providers globales + Home con área (pokemon|naruto),
// 4 estados (loading / error / empty / content) y 4 tabs.
import { PokemonProvider, usePokemon } from './context/PokemonContext';
import { NarutoProvider, useNaruto } from './context/NarutoContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RADIUS } from './theme/tokens';
import { SearchBar } from './components/SearchBar';
import { BottomTabs } from './components/BottomTabs';
import { GalleryScreen } from './components/GalleryScreen';
import { DataScreen } from './components/DataScreen';
import { NarutoGalleryScreen } from './components/NarutoGalleryScreen';
import { NarutoDataScreen } from './components/NarutoDataScreen';
import { EmptyState } from './components/EmptyState';
import { ThemeFab } from './components/ThemeFab';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';

function Home() {
  const [area, setArea] = useState('pokemon'); // pokemon | naruto
  const [settingsVisible, setSettingsVisible] = useState(false);
  const poke = usePokemon();
  const naru = useNaruto();
  const { colors, narutoColors } = useTheme();
  const ctx = area === 'pokemon' ? poke : naru;
  const isNaruto = area === 'naruto';
  const accent = isNaruto ? narutoColors.primary : colors.primary;
  const title = isNaruto ? 'Ninja Explorer' : 'Poké Explorer';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={isNaruto ? 'ninja' : 'pokeball'} size={28} color="#fff" />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SearchBar
          value={ctx.query}
          onChange={ctx.setQuery}
          onSearch={ctx.search}
          color={accent}
          placeholder={isNaruto ? 'Ej. sasuke, 1307, sakura' : 'Ej. pikachu, 25, charizard'}
          label={isNaruto ? 'Buscar personaje por nombre o número' : 'Buscar pokemon por nombre o número'}
        />

        {ctx.loading && <ActivityIndicator size="large" color={accent} style={styles.loader} />}

        {!ctx.loading && ctx.error && (
          <View style={[styles.errorBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.errorText, { color: colors.textDark }]}>{ctx.error}</Text>
            <Pressable style={[styles.retry, { backgroundColor: accent }]} onPress={ctx.search} accessibilityRole="button" accessibilityLabel="Reintentar">
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {!ctx.loading && !ctx.error && ctx.isEmpty && (
          <EmptyState message={isNaruto ? 'Busca un personaje para ver galería y datos' : undefined} />
        )}

        {!ctx.loading && !ctx.error && !ctx.isEmpty && (
          isNaruto
            ? (naru.activeTab === 'galeria' ? <NarutoGalleryScreen /> : <NarutoDataScreen />)
            : (poke.activeTab === 'galeria' ? <GalleryScreen /> : <DataScreen />)
        )}
      </ScrollView>

      <BottomTabs area={area} setArea={setArea} />
      <ThemeFab onPress={() => setSettingsVisible(true)} />
      <ThemeSettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PokemonProvider>
        <NarutoProvider>
          <Home />
        </NarutoProvider>
      </PokemonProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 28, paddingBottom: 18, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 4, zIndex: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginLeft: 10, letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  loader: { marginTop: 40 },
  errorBox: { borderRadius: RADIUS.xl, padding: 20, alignItems: 'center', width: '100%' },
  errorText: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  retry: { borderRadius: RADIUS.m, paddingHorizontal: 20, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
