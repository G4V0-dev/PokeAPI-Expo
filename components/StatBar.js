import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/tokens';

export function StatBar({ label, value, color }) {
  const pct = Math.min((Number(value) || 0) / 200, 1) * 100;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { width: 60, fontSize: 13, fontWeight: '800', color: COLORS.textMedium },
  value: { width: 36, fontSize: 14, fontWeight: '700', color: COLORS.textDark, textAlign: 'right', marginRight: 12 },
  track: { flex: 1, height: 8, backgroundColor: COLORS.barBackground, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
