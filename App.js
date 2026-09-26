import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Entrada de la app: Provider global + Home con los 4 estados
// (loading / error / empty / content) y tabs Galería | Datos.
import { PokemonProvider, usePokemon } from './context/PokemonContext';
import { COLORS, RADIUS } from './theme/tokens';
import { SearchBar } from './components/SearchBar';
import { BottomTabs } from './components/BottomTabs';
import { GalleryScreen } from './components/GalleryScreen';
import { DataScreen } from './components/DataScreen';
import { EmptyState } from './components/EmptyState';

function Home() {
  const { loading, error, isEmpty, activeTab, search, pokemonData } = usePokemon();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="pokeball" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Poké Explorer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SearchBar />

        {loading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={search} accessibilityRole="button" accessibilityLabel="Reintentar">
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && isEmpty && <EmptyState />}

        {!loading && !error && pokemonData && (activeTab === 'galeria' ? <GalleryScreen /> : <DataScreen />)}
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

export default function App() {
  return (
    <PokemonProvider>
      <Home />
    </PokemonProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 28, paddingBottom: 18, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 4, zIndex: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginLeft: 10, letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  loader: { marginTop: 40 },
  errorBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, alignItems: 'center', width: '100%' },
  errorText: { fontSize: 15, color: COLORS.textDark, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  retry: { backgroundColor: COLORS.primary, borderRadius: RADIUS.m, paddingHorizontal: 20, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
