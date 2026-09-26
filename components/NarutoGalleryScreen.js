import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNaruto } from '../context/NarutoContext';
import { COLORS, NARUTO_COLORS, RADIUS } from '../theme/tokens';

// Vista Galería Naruto: IMÁGENES + nombre + clan/aldea + jutsu insignia. Sin datos finos.
export function NarutoGalleryScreen() {
  const { characterData, next, prev } = useNaruto();
  if (!characterData) return null;
  const [hero, ...rest] = characterData.images.length ? characterData.images : [null];
  const disabledPrev = characterData.prevId == null;
  const disabledNext = characterData.nextId == null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>#{characterData.id}</Text>
        <Text style={styles.title}>{String(characterData.name).toUpperCase()}</Text>
      </View>

      {hero ? (
        <Image style={styles.hero} source={{ uri: hero }} accessibilityLabel={`Imagen de ${characterData.name}`} />
      ) : null}

      <View style={styles.prevNext}>
        <Pressable style={[styles.nav, disabledPrev && styles.navDisabled]} onPress={prev} disabled={disabledPrev} accessibilityLabel="Personaje anterior">
          <Ionicons name="chevron-back" size={20} color={disabledPrev ? '#A0AEC0' : COLORS.textDark} />
          <Text style={styles.navText}>Atrás</Text>
        </Pressable>
        <Pressable style={[styles.nav, disabledNext && styles.navDisabled]} onPress={next} disabled={disabledNext} accessibilityLabel="Personaje siguiente">
          <Text style={styles.navText}>Siguiente</Text>
          <Ionicons name="chevron-forward" size={20} color={disabledNext ? '#A0AEC0' : COLORS.textDark} />
        </Pressable>
      </View>

      {!!rest.length && (
        <>
          <Text style={styles.section}>OTRAS IMÁGENES</Text>
          <View style={styles.grid}>
            {rest.slice(0, 2).map((uri) => (
              <View key={uri} style={styles.spriteCard}>
                <Image style={styles.sprite} source={{ uri }} accessibilityLabel={`${characterData.name}`} />
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.chips}>
        {!!characterData.clan && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Clan {characterData.clan}</Text>
          </View>
        )}
        {characterData.villages.slice(0, 2).map((v) => (
          <View key={v} style={[styles.chip, styles.chipGhost]}>
            <Text style={styles.chipText}>{v}</Text>
          </View>
        ))}
      </View>

      {!!characterData.signatureJutsu && (
        <View style={styles.jutsu}>
          <MaterialCommunityIcons name="flash" size={18} color={NARUTO_COLORS.primary} />
          <View style={styles.jutsuText}>
            <Text style={styles.jutsuLabel}>JUTSU INSIGNIA</Text>
            <Text style={styles.jutsuName}>{characterData.signatureJutsu}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  id: { fontSize: 16, fontWeight: '800', color: NARUTO_COLORS.primary, backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', marginRight: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  hero: { width: 220, height: 220, alignSelf: 'center', borderRadius: RADIUS.l },
  prevNext: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44 },
  navDisabled: { opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginHorizontal: 6 },
  section: { fontSize: 13, fontWeight: '800', color: COLORS.textMedium, letterSpacing: 0.5, marginTop: 12, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 12 },
  spriteCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.l, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  sprite: { width: 110, height: 110, borderRadius: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { backgroundColor: COLORS.secondary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipGhost: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  chipText: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  jutsu: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.background, borderRadius: RADIUS.l, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  jutsuText: { flex: 1 },
  jutsuLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMedium, letterSpacing: 0.5 },
  jutsuName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginTop: 2 },
});
