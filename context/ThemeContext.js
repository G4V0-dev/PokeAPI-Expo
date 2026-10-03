import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_THEME_ID, THEMES } from '../theme/tokens';

const ThemeContext = createContext(null);

/**
 * ThemeProvider: paleta global en memoria (sin persistencia por decisión de usuario).
 * Cada tema trae `colors` (base Pokémon) + narutoPrimary/narutoPrimaryDark (acento por área).
 * Expone `colors` y `narutoColors` con la misma forma que COLORS/NARUTO_COLORS legacy.
 */
export function ThemeProvider({ children, initialThemeId = DEFAULT_THEME_ID }) {
  const [themeId, setThemeId] = useState(initialThemeId);

  const value = useMemo(() => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const colors = theme.colors;
    const narutoColors = {
      ...theme.colors,
      primary: theme.narutoPrimary,
      primaryDark: theme.narutoPrimaryDark,
    };
    return { theme, themeId: theme.id, themes: THEMES, setThemeId, colors, narutoColors };
  }, [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
