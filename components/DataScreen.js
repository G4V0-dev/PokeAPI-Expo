import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RADIUS } from '../theme/tokens';
import { usePokemon } from '../context/PokemonContext';
import { useTheme } from '../context/ThemeContext';
import { StatBar } from './StatBar';

// Vista Secundaria: MUESTRA LOS DATOS (altura, peso, stats, species/tipos, moves todos). Sin imagenes hero.
export function DataScreen() {
  const { pokemonData } = usePokemon();
  const { colors } = useTheme();
  if (!pokemonData) return null;
  const s = pokemonData.stats;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.physique, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.physiqueItem}>
          <Text style={[styles.physiqueValue, { color: colors.textDark }]}>{pokemonData.heightM} m</Text>
          <Text style={[styles.physiqueLabel, { color: colors.textMedium }]}>ALTURA</Text>
        </View>
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
        <View style={styles.physiqueItem}>
          <Text style={[styles.physiqueValue, { color: colors.textDark }]}>{pokemonData.weightKg} kg</Text>
          <Text style={[styles.physiqueLabel, { color: colors.textMedium }]}>PESO</Text>
        </View>
      </View>

      <Text style={[styles.section, { color: colors.textDark }]}>ESTADÍSTICAS BASE · TOTAL {s.total}</Text>
      <StatBar label="PS" value={s.hp} color={colors.hp} />
      <StatBar label="ATQ" value={s.attack} color={colors.attack} />
      <StatBar label="DEF" value={s.defense} color={colors.defense} />
      <StatBar label="A.ESP" value={s.spAtk} color={colors.spAtk} />
      <StatBar label="D.ESP" value={s.spDef} color={colors.spDef} />
      <StatBar label="VEL" value={s.speed} color={colors.speed} />

      <Text style={[styles.section, { color: colors.textDark }]}>SPECIES / TIPOS</Text>
      <View style={styles.chips}>
        {pokemonData.types.map((t) => (
          <View key={t} style={[styles.chip, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.chipText, { color: colors.textDark }]}>{t}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.abilities, { color: colors.textMedium }]}>Habilidad: {pokemonData.abilities[0] || '—'}</Text>

      <Text style={[styles.section, { color: colors.textDark }]}>MOVIMIENTOS ({pokemonData.moves.length})</Text>
      <View style={styles.chips}>
        {pokemonData.moves.map((m) => (
          <View key={m} style={[styles.move, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.moveText, { color: colors.textDark }]}>{m}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  physique: { flexDirection: 'row', borderRadius: RADIUS.l, padding: 16, marginBottom: 16, borderWidth: 1 },
  physiqueItem: { flex: 1, alignItems: 'center' },
  physiqueValue: { fontSize: 18, fontWeight: '800' },
  physiqueLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  sep: { width: 1, marginHorizontal: 12 },
  section: { fontSize: 13, fontWeight: '800', marginTop: 8, marginBottom: 12, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  abilities: { fontSize: 13, marginBottom: 8 },
  move: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  moveText: { fontSize: 13, textTransform: 'capitalize', fontWeight: '600' },
});
