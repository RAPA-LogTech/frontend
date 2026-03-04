'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAppTheme } from '@/theme/theme';

const THEME_MODE_STORAGE_KEY = 'logtech-theme-mode';

const isValidPaletteMode = (value: string | null): value is PaletteMode => {
  return value === 'dark' || value === 'light';
};

const getInitialMode = (): PaletteMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);

  if (isValidPaletteMode(savedMode)) {
    return savedMode;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialHasUserPreference = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return isValidPaletteMode(localStorage.getItem(THEME_MODE_STORAGE_KEY));
};

type ColorModeContextType = {
  mode: PaletteMode;
  toggleMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType | null>(null);

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within AppProviders');
  }
  return context;
};

const queryClient = new QueryClient();

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  const [hasUserPreference, setHasUserPreference] = useState(getInitialHasUserPreference);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (hasUserPreference) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setMode(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [hasUserPreference]);

  const toggleMode = () => {
    setMode((prev) => {
      const nextMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });

    if (!hasUserPreference) {
      setHasUserPreference(true);
    }
  };

  const colorModeValue = useMemo(() => ({ mode, toggleMode }), [mode]);
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  if (!isMounted) {
    return null;
  }

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </ColorModeContext.Provider>
  );
}
