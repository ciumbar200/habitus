/**
 * ThemeProvider - Context for managing theme and providing design tokens
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { liquidGlassTheme, colors } from '../../theme/liquidGlass';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof liquidGlassTheme.colors;
  theme: typeof liquidGlassTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultDark?: boolean;
}

export const ThemeProvider = ({ children, defaultDark }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(defaultDark ?? systemColorScheme === 'dark');

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isDark,
      toggleTheme,
      colors: colors,
      theme: liquidGlassTheme,
    }),
    [isDark, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextType }>
) => {
  return (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};
