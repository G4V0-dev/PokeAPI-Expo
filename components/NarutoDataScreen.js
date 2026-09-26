import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../theme/tokens';
import { useNaruto } from '../context/NarutoContext';

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
  if (!characterData) return null;
  const kv = (k, v) => {
    const text = formatDetail(v);
    return (!!text && (
      <View key={k} style={styles.physiqueItem}>
        <Text style={styles.physiqueValue}>{text}</Text>
        <Text style={styles.physiqueLabel}>{k}</Text>
      </View>
    ));
  };
  return (
    <View style={styles.card}>
      <View style={styles.physique}>
        {kv('SEXO', characterData.sex)}
        {kv('EDAD', characterData.age)}
        {kv('ALTURA', characterData.height)}
        {kv('PESO', characterData.weight)}
      </View>

      <Text style={styles.section}>DEBUT</Text>
      {!!characterData.debutManga && <Text style={styles.line}>Manga: {characterData.debutManga}</Text>}
      {!!characterData.debutAnime && <Text style={styles.line}>Anime: {characterData.debutAnime}</Text>}

      {!!characterData.natureTypes.length && (
        <>
          <Text style={styles.section}>NATURALEZAS DE CHAKRA</Text>
          <View style={styles.chips}>
            {characterData.natureTypes.map((n, i) => {
              const label = formatDetail(n) || `Tipo ${i + 1}`;
              return (
                <View key={`${label}-${i}`} style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.section}>JUTSUS ({characterData.jutsus.length})</Text>
      <View style={styles.chips}>
        {characterData.jutsus.map((j, i) => {
          const label = formatDetail(j) || `Jutsu ${i + 1}`;
          return (
            <View key={`${label}-${i}`} style={styles.move}><Text style={styles.moveText}>{label}</Text></View>
          );
        })}
      </View>

      {!!Object.keys(characterData.family).length && (
        <>
          <Text style={styles.section}>FAMILIA</Text>
          {Object.entries(characterData.family).map(([rel, name]) => (
            <Text key={rel} style={styles.line}>{rel}: {formatDetail(name)}</Text>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  physique: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: COLORS.background, borderRadius: RADIUS.l, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  physiqueItem: { flex: 1, minWidth: '40%', alignItems: 'center' },
  physiqueValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, textAlign: 'center' },
  physiqueLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMedium, marginTop: 4 },
  section: { fontSize: 13, fontWeight: '800', color: COLORS.textDark, marginTop: 12, marginBottom: 8, letterSpacing: 0.5 },
  line: { fontSize: 14, color: COLORS.textDark, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { backgroundColor: COLORS.secondary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  move: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  moveText: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
});
