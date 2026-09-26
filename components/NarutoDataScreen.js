import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../theme/tokens';
import { useNaruto } from '../context/NarutoContext';

// Vista Datos Naruto: ficha completa (físico, debut, naturalezas, jutsus, familia).
// Sin imágenes hero.
export function NarutoDataScreen() {
  const { characterData } = useNaruto();
  if (!characterData) return null;
  const kv = (k, v) => (!!v && (
    <View key={k} style={styles.physiqueItem}>
      <Text style={styles.physiqueValue}>{v}</Text>
      <Text style={styles.physiqueLabel}>{k}</Text>
    </View>
  ));
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
            {characterData.natureTypes.map((n) => (
              <View key={n} style={styles.chip}><Text style={styles.chipText}>{n}</Text></View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.section}>JUTSUS ({characterData.jutsus.length})</Text>
      <View style={styles.chips}>
        {characterData.jutsus.map((j) => (
          <View key={j} style={styles.move}><Text style={styles.moveText}>{j}</Text></View>
        ))}
      </View>

      {!!Object.keys(characterData.family).length && (
        <>
          <Text style={styles.section}>FAMILIA</Text>
          {Object.entries(characterData.family).map(([rel, name]) => (
            <Text key={rel} style={styles.line}>{rel}: {String(name)}</Text>
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
