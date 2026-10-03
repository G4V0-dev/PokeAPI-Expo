import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePokemon } from '../context/PokemonContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../theme/tokens';

// Vista Principal: MUESTRA 3 IMAGENES (hero official + normal + shiny). Nada de stats/moves aqui.
export function GalleryScreen() {
  const { pokemonData, currentId, next, prev, isLiked, setIsLiked, isFirst, isLast } = usePokemon();
  const { colors } = useTheme();
  if (!pokemonData) return null;
  const disabledPrev = isFirst || !currentId || currentId <= 1;
  const disabledNext = isLast;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.id, { color: colors.primary, backgroundColor: colors.secondary }]}>#{String(pokemonData.id).padStart(3, '0')}</Text>
        <Text style={[styles.title, { color: colors.textDark }]}>{pokemonData.name.toUpperCase()}</Text>
        <Pressable onPress={() => setIsLiked(!isLiked)} style={styles.like} accessibilityRole="button" accessibilityLabel="Me gusta">
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={30} color={isLiked ? colors.liked : colors.textMedium} />
        </Pressable>
      </View>

      <Image style={styles.hero} source={{ uri: pokemonData.sprites.official }} accessibilityLabel={`Arte oficial de ${pokemonData.name}`} />

      <View style={styles.prevNext}>
        <Pressable style={[styles.nav, { backgroundColor: colors.background }, disabledPrev && styles.navDisabled]} onPress={prev} disabled={disabledPrev}>
          <Ionicons name="chevron-back" size={20} color={disabledPrev ? '#A0AEC0' : colors.textDark} />
          <Text style={[styles.navText, { color: colors.textDark }]}>Atrás</Text>
        </Pressable>
        <Pressable style={[styles.nav, { backgroundColor: colors.background }, disabledNext && styles.navDisabled]} onPress={next} disabled={disabledNext}>
          <Text style={[styles.navText, { color: colors.textDark }]}>Siguiente</Text>
          <Ionicons name="chevron-forward" size={20} color={disabledNext ? '#A0AEC0' : colors.textDark} />
        </Pressable>
      </View>

      <Text style={[styles.section, { color: colors.textMedium }]}>VARIACIONES DEL SPRITE</Text>
      <View style={styles.grid}>
        <View style={[styles.spriteCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Image style={styles.sprite} source={{ uri: pokemonData.sprites.normal }} accessibilityLabel={`${pokemonData.name} normal`} />
          <Text style={[styles.spriteLabel, { color: colors.textDark }]}>Normal</Text>
        </View>
        <View style={[styles.spriteCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Image style={styles.sprite} source={{ uri: pokemonData.sprites.shiny }} accessibilityLabel={`${pokemonData.name} shiny`} />
          <Text style={[styles.spriteLabel, { color: colors.textDark }]}>Shiny</Text>
        </View>
      </View>

      <View style={styles.meta}>
        <MaterialCommunityIcons name="pokeball" size={18} color={colors.primary} />
        <Text style={[styles.metaText, { color: colors.primary }]}>{pokemonData.types.join(' · ').toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: 20, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  id: { fontSize: 16, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', marginRight: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: '800' },
  like: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { width: 220, height: 220, alignSelf: 'center' },
  prevNext: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44 },
  navDisabled: { opacity: 0.5 },
  navText: { fontSize: 14, fontWeight: '700', marginHorizontal: 6 },
  section: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginTop: 8, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 12 },
  spriteCard: { flex: 1, borderRadius: RADIUS.l, padding: 12, alignItems: 'center', borderWidth: 1 },
  sprite: { width: 110, height: 110 },
  spriteLabel: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  metaText: { fontSize: 13, fontWeight: '800' },
});
