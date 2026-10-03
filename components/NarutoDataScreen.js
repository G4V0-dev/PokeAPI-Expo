import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RADIUS } from '../theme/tokens';
import { useNaruto } from '../context/NarutoContext';
import { useTheme } from '../context/ThemeContext';

// Dattebayo devuelve sex/age/height/weight como string O como objeto por saga
// ({'Part I': '12-13', 'Part II': '16-17'}). React no renderiza objetos como hijo:
// hay que aplanarlos a string legible antes de pintarlos.
function formatDetail(v) {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(formatDetail).filter(Boolean).join(', ') || null;
  if (typeof v === 'object') {
    return Object.entries(v)
      .map(([k, val]) => `${k}: ${formatDetail(val)}`)
      .filter((s) => s && !s.endsWith(': null') && !s.endsWith(': '))
      .join(' · ') || null;
  }
  return String(v);
}

// Vista Datos Naruto: ficha completa (físico, debut, naturalezas, jutsus, familia).
// Sin imágenes hero.
export function NarutoDataScreen() {
  const { characterData } = useNaruto();
  const { colors } = useTheme();
  if (!characterData) return null;
  const kv = (k, v) => {
    const text = formatDetail(v);
    return (!!text && (
      <View key={k} style={styles.physiqueItem}>
        <Text style={[styles.physiqueValue, { color: colors.textDark }]}>{text}</Text>
        <Text style={[styles.physiqueLabel, { color: colors.textMedium }]}>{k}</Text>
      </View>
    ));
  };
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.physique, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {kv('SEXO', characterData.sex)}
        {kv('EDAD', characterData.age)}
        {kv('ALTURA', characterData.height)}
        {kv('PESO', characterData.weight)}
      </View>

      <Text style={[styles.section, { color: colors.textDark }]}>DEBUT</Text>
      {!!characterData.debutManga && <Text style={[styles.line, { color: colors.textDark }]}>Manga: {characterData.debutManga}</Text>}
      {!!characterData.debutAnime && <Text style={[styles.line, { color: colors.textDark }]}>Anime: {characterData.debutAnime}</Text>}

      {!!characterData.natureTypes.length && (
        <>
          <Text style={[styles.section, { color: colors.textDark }]}>NATURALEZAS DE CHAKRA</Text>
          <View style={styles.chips}>
            {characterData.natureTypes.map((n, i) => {
              const label = formatDetail(n) || `Tipo ${i + 1}`;
              return (
                <View key={`${label}-${i}`} style={[styles.chip, { backgroundColor: colors.secondary }]}><Text style={[styles.chipText, { color: colors.textDark }]}>{label}</Text></View>
              );
            })}
          </View>
        </>
      )}

      <Text style={[styles.section, { color: colors.textDark }]}>JUTSUS ({characterData.jutsus.length})</Text>
      <View style={styles.chips}>
        {characterData.jutsus.map((j, i) => {
          const label = formatDetail(j) || `Jutsu ${i + 1}`;
          return (
            <View key={`${label}-${i}`} style={[styles.move, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.moveText, { color: colors.textDark }]}>{label}</Text></View>
          );
        })}
      </View>

      {!!Object.keys(characterData.family).length && (
        <>
          <Text style={[styles.section, { color: colors.textDark }]}>FAMILIA</Text>
          {Object.entries(characterData.family).map(([rel, name]) => (
            <Text key={rel} style={[styles.line, { color: colors.textDark }]}>{rel}: {formatDetail(name)}</Text>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  physique: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: RADIUS.l, padding: 16, marginBottom: 8, borderWidth: 1, gap: 12 },
  physiqueItem: { flex: 1, minWidth: '40%', alignItems: 'center' },
  physiqueValue: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  physiqueLabel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  section: { fontSize: 13, fontWeight: '800', marginTop: 12, marginBottom: 8, letterSpacing: 0.5 },
  line: { fontSize: 14, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '800' },
  move: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  moveText: { fontSize: 13, fontWeight: '600' },
});
