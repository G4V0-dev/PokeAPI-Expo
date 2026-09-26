// Design tokens TS-idiom en JS (proyecto JS existente: no se migra a TS para no reestructurar).
// Polish Fase 6: rojo Pokeball #EE1515 retirado del header (muy llamativo) -> indigo moderno.
// Identidad Pokemon queda en toques: icono pokeball, badge ID amber, corazon like.
export const COLORS = {
  primary: '#D64545', // Rojo fandom suavizado (CTA, search, tab activa, header) — Pokeball sin gritar
  primaryDark: '#A93232',
  secondary: '#FFC83D', // Amber suave (badge ID, acentos electricos)
  background: '#FAF6F2', // Warm neutro moderno
  surface: '#FFFFFF',
  textDark: '#2A2323',
  textMedium: '#8A7E7E',
  border: '#EDDFD9',
  liked: '#F43F5E',
  hp: '#68D391',
  attack: '#F6AD55',
  defense: '#F6E05E',
  speed: '#63B3ED',
  spAtk: '#B794F4',
  spDef: '#9AE6B4',
  barBackground: '#EDF2F7',
};

export const RADIUS = { s: 8, m: 12, l: 16, xl: 24 };
export const SPACING = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 };

// Área Naruto: mismo sistema, acento naranja ninja en vez del rojo fandom.
export const NARUTO_COLORS = {
  ...COLORS,
  primary: '#DD6B20', // Naranja ninja (header, CTAs, tabs de Naruto)
  primaryDark: '#9C4221',
};
