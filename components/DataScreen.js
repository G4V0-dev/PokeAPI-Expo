import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../theme/tokens';
import { usePokemon } from '../context/PokemonContext';
import { StatBar } from './StatBar';

// Vista Secundaria: MUESTRA LOS DATOS (altura, peso, stats, species/tipos, moves todos). Sin imagenes hero.
export function DataScreen() {
  const { pokemonData } = usePokemon();
  if (!pokemonData) return null;
  const s = pokemonData.stats;
  return (
    <View style={styles.card}>
      <View style={styles.physique}>
        <View style={styles.physiqueItem}>
          <Text style={styles.physiqueValue}>{pokemonData.heightM} m</Text>
          <Text style={styles.physiqueLabel}>ALTURA</Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.physiqueItem}>
          <Text style={styles.physiqueValue}>{pokemonData.weightKg} kg</Text>
          <Text style={styles.physiqueLabel}>PESO</Text>
        </View>
      </View>

      <Text style={styles.section}>ESTADÍSTICAS BASE · TOTAL {s.total}</Text>
      <StatBar label="PS" value={s.hp} color={COLORS.hp} />
      <StatBar label="ATQ" value={s.attack} color={COLORS.attack} />
      <StatBar label="DEF" value={s.defense} color={COLORS.defense} />
      <StatBar label="A.ESP" value={s.spAtk} color={COLORS.spAtk} />
      <StatBar label="D.ESP" value={s.spDef} color={COLORS.spDef} />
      <StatBar label="VEL" value={s.speed} color={COLORS.speed} />

      <Text style={styles.section}>SPECIES / TIPOS</Text>
      <View style={styles.chips}>
        {pokemonData.types.map((t) => (
          <View key={t} style={styles.chip}>
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.abilities}>Habilidad: {pokemonData.abilities[0] || '—'}</Text>

      <Text style={styles.section}>MOVIMIENTOS ({pokemonData.moves.length})</Text>
      <View style={styles.chips}>
        {pokemonData.moves.map((m) => (
          <View key={m} style={styles.move}>
            <Text style={styles.moveText}>{m}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  physique: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: RADIUS.l, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  physiqueItem: { flex: 1, alignItems: 'center' },
  physiqueValue: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  physiqueLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMedium, marginTop: 4 },
  sep: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 12 },
  section: { fontSize: 13, fontWeight: '800', color: COLORS.textDark, marginTop: 8, marginBottom: 12, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: COLORS.secondary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '800', color: COLORS.textDark, textTransform: 'capitalize' },
  abilities: { fontSize: 13, color: COLORS.textMedium, marginBottom: 8 },
  move: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  moveText: { fontSize: 13, color: COLORS.textDark, textTransform: 'capitalize', fontWeight: '600' },
});
