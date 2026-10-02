import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePokemon } from '../context/PokemonContext';
import { COLORS, RADIUS } from '../theme/tokens';

// Vista Principal: MUESTRA 3 IMAGENES (hero official + normal + shiny). Nada de stats/moves aqui.
export function GalleryScreen() {
  const { pokemonData, currentId, next, prev, isLiked, setIsLiked, isFirst, isLast } = usePokemon();
  if (!pokemonData) return null;
  const disabledPrev = isFirst || !currentId || currentId <= 1;
  const disabledNext = isLast;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>#{String(pokemonData.id).padStart(3, '0')}</Text>
        <Text style={styles.title}>{pokemonData.name.toUpperCase()}</Text>
        <Pressable onPress={() => setIsLiked(!isLiked)} style={styles.like} accessibilityRole="button" accessibilityLabel="Me gusta">
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={30} color={isLiked ? COLORS.liked : COLORS.textMedium} />
        </Pressable>
      </View>

      <Image style={styles.hero} source={{ uri: pokemonData.sprites.official }} accessibilityLabel={`Arte oficial de ${pokemonData.name}`} />

      <View style={styles.prevNext}>
        <Pressable style={[styles.nav, disabledPrev && styles.navDisabled]} onPress={prev} disabled={disabledPrev}>
          <Ionicons name="chevron-back" size={20} color={disabledPrev ? '#A0AEC0' : COLORS.textDark} />
          <Text style={styles.navText}>Atrás</Text>
        </Pressable>
        <Pressable style={[styles.nav, disabledNext && styles.navDisabled]} onPress={next} disabled={disabledNext}>
          <Text style={styles.navText}>Siguiente</Text>
          <Ionicons name="chevron-forward" size={20} color={disabledNext ? '#A0AEC0' : COLORS.textDark} />
        </Pressable>
      </View>

      <Text style={styles.section}>VARIACIONES DEL SPRITE</Text>
      <View style={styles.grid}>
        <View style={styles.spriteCard}>
          <Image style={styles.sprite} source={{ uri: pokemonData.sprites.normal }} accessibilityLabel={`${pokemonData.name} normal`} />
          <Text style={styles.spriteLabel}>Normal</Text>
        </View>
        <View style={styles.spriteCard}>
          <Image style={styles.sprite} source={{ uri: pokemonData.sprites.shiny }} accessibilityLabel={`${pokemonData.name} shiny`} />
          <Text style={styles.spriteLabel}>Shiny</Text>
        </View>
      </View>

      <View style={styles.meta}>
        <MaterialCommunityIcons name="pokeball" size={18} color={COLORS.primary} />
        <Text style={styles.metaText}>{pokemonData.types.join(' · ').toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  id: { fontSize: 16, fontWeight: '800', color: COLORS.primary, backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', marginRight: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  like: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { width: 220, height: 220, alignSelf: 'center' },
  prevNext: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44 },
  navDisabled: { opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginHorizontal: 6 },
  section: { fontSize: 13, fontWeight: '800', color: COLORS.textMedium, letterSpacing: 0.5, marginTop: 8, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 12 },
  spriteCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.l, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  sprite: { width: 110, height: 110 },
  spriteLabel: { marginTop: 6, fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  metaText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
});
