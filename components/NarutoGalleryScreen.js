import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNaruto } from '../context/NarutoContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// Vista Galería Naruto: IMÁGENES + nombre + clan/aldea + jutsu insignia. Sin datos finos.
export function NarutoGalleryScreen() {
  const { characterData, next, prev } = useNaruto();
  const { colors, narutoColors } = useTheme();
  if (!characterData) return null;
  const [hero, ...rest] = characterData.images.length ? characterData.images : [null];
  const disabledPrev = characterData.prevId == null;
  const disabledNext = characterData.nextId == null;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.id, { color: narutoColors.primary, backgroundColor: colors.secondary }]}>#{characterData.id}</Text>
        <Text style={[styles.title, { color: colors.textDark }]}>{String(characterData.name).toUpperCase()}</Text>
      </View>

      {hero ? (
        <Image style={styles.hero} source={{ uri: hero }} accessibilityLabel={`Imagen de ${characterData.name}`} />
      ) : null}

      <View style={styles.prevNext}>
        <Pressable style={[styles.nav, { backgroundColor: colors.background }, disabledPrev && styles.navDisabled]} onPress={prev} disabled={disabledPrev} accessibilityLabel="Personaje anterior">
          <Ionicons name="chevron-back" size={20} color={disabledPrev ? '#A0AEC0' : colors.textDark} />
          <Text style={[styles.navText, { color: colors.textDark }]}>Atrás</Text>
        </Pressable>
        <Pressable style={[styles.nav, { backgroundColor: colors.background }, disabledNext && styles.navDisabled]} onPress={next} disabled={disabledNext} accessibilityLabel="Personaje siguiente">
          <Text style={[styles.navText, { color: colors.textDark }]}>Siguiente</Text>
          <Ionicons name="chevron-forward" size={20} color={disabledNext ? '#A0AEC0' : colors.textDark} />
        </Pressable>
      </View>

      {!!rest.length && (
        <>
          <Text style={[styles.section, { color: colors.textMedium }]}>OTRAS IMÁGENES</Text>
          <View style={styles.grid}>
            {rest.slice(0, 2).map((uri) => (
              <View key={uri} style={[styles.spriteCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Image style={styles.sprite} source={{ uri }} accessibilityLabel={`${characterData.name}`} />
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.chips}>
        {!!characterData.clan && (
          <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.chipText, { color: colors.textDark }]}>Clan {characterData.clan}</Text>
          </View>
        )}
        {characterData.villages.slice(0, 2).map((v) => (
          <View key={v} style={[styles.chip, styles.chipGhost, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.textDark }]}>{v}</Text>
          </View>
        ))}
      </View>

      {!!characterData.signatureJutsu && (
        <View style={[styles.jutsu, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="flash" size={18} color={narutoColors.primary} />
          <View style={styles.jutsuText}>
            <Text style={[styles.jutsuLabel, { color: colors.textMedium }]}>JUTSU INSIGNIA</Text>
            <Text style={[styles.jutsuName, { color: colors.textDark }]}>{characterData.signatureJutsu}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  id: { fontSize: 16, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', marginRight: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: '800' },
  hero: { width: 220, height: 220, alignSelf: 'center', borderRadius: RADIUS.l },
  prevNext: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44 },
  navDisabled: { opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '700', marginHorizontal: 6 },
  section: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginTop: 12, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 12 },
  spriteCard: { flex: 1, borderRadius: RADIUS.l, padding: 12, alignItems: 'center', borderWidth: 1 },
  sprite: { width: 110, height: 110, borderRadius: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipGhost: { borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '800' },
  jutsu: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.l, padding: 14, marginTop: 12, borderWidth: 1 },
  jutsuText: { flex: 1 },
  jutsuLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  jutsuName: { fontSize: 16, fontWeight: '800', marginTop: 2 },
});
