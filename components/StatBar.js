import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function StatBar({ label, value, color }) {
  const { colors } = useTheme();
  const pct = Math.min((Number(value) || 0) / 200, 1) * 100;
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMedium }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.textDark }]}>{value}</Text>
      <View style={[styles.track, { backgroundColor: colors.barBackground }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { width: 60, fontSize: 13, fontWeight: '800' },
  value: { width: 36, fontSize: 14, fontWeight: '700', textAlign: 'right', marginRight: 12 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
