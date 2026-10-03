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

// 5 estilos con paletas totalmente diferentes (solo colores, mismo layout/radios).
// Cada estilo trae acento por área: primary Pokémon + primary Naruto distintos.
// Decisión usuario: solo paleta, propuesto por dev, sin persistencia (solo sesión).
export const THEMES = [
  {
    id: 'fandom',
    name: 'Fandom Rojo',
    description: 'Original cálido: rojo Pokéball + naranja ninja',
    colors: { ...COLORS },
    narutoPrimary: '#DD6B20',
    narutoPrimaryDark: '#9C4221',
  },
  {
    id: 'oceano',
    name: 'Océano Profundo',
    description: 'Azul agua + cian eléctrico + niebla ninja',
    colors: {
      primary: '#2563EB',
      primaryDark: '#1E40AF',
      secondary: '#22D3EE',
      background: '#EFF6FF',
      surface: '#FFFFFF',
      textDark: '#0C243C',
      textMedium: '#64748B',
      border: '#BFDBFE',
      liked: '#EC4899',
      hp: '#34D399',
      attack: '#60A5FA',
      defense: '#FACC15',
      speed: '#22D3EE',
      spAtk: '#A78BFA',
      spDef: '#6EE7B7',
      barBackground: '#DBEAFE',
    },
    narutoPrimary: '#0E7490',
    narutoPrimaryDark: '#155E75',
  },
  {
    id: 'bosque',
    name: 'Bosque Esmeralda',
    description: 'Verde planta + lima + tierra ninja',
    colors: {
      primary: '#059669',
      primaryDark: '#065F46',
      secondary: '#A3E635',
      background: '#ECFDF5',
      surface: '#FFFFFF',
      textDark: '#1A2E22',
      textMedium: '#6B9080',
      border: '#A7F3D0',
      liked: '#E11D48',
      hp: '#22C55E',
      attack: '#F59E0B',
      defense: '#EAB308',
      speed: '#10B981',
      spAtk: '#8B5CF6',
      spDef: '#34D399',
      barBackground: '#D1FAE5',
    },
    narutoPrimary: '#B45309',
    narutoPrimaryDark: '#78350F',
  },
  {
    id: 'atardecer',
    name: 'Atardecer Psíquico',
    description: 'Morado + coral + naranja ocaso',
    colors: {
      primary: '#7C3AED',
      primaryDark: '#5B21B6',
      secondary: '#FB7185',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      textDark: '#331832',
      textMedium: '#A0848C',
      border: '#FED7AA',
      liked: '#DB2777',
      hp: '#4ADE80',
      attack: '#FB923C',
      defense: '#FDE047',
      speed: '#C084FC',
      spAtk: '#F0ABFC',
      spDef: '#86EFAC',
      barBackground: '#FFEDD5',
    },
    narutoPrimary: '#EA580C',
    narutoPrimaryDark: '#9A3412',
  },
  {
    id: 'medianoche',
    name: 'Medianoche Neón',
    description: 'Oscuro: fucsia neón + amarillo + naranja',
    colors: {
      primary: '#E879F9',
      primaryDark: '#A21CAF',
      secondary: '#FACC15',
      background: '#0F172A',
      surface: '#1E293B',
      textDark: '#F1F5F9',
      textMedium: '#94A3B8',
      border: '#334155',
      liked: '#FB7185',
      hp: '#4ADE80',
      attack: '#FB923C',
      defense: '#FDE047',
      speed: '#38BDF8',
      spAtk: '#C084FC',
      spDef: '#6EE7B7',
      barBackground: '#334155',
    },
    narutoPrimary: '#F97316',
    narutoPrimaryDark: '#C2410C',
  },
];

export const DEFAULT_THEME_ID = 'oceano';
