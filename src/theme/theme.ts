/**
 * Design Tokens for Tailwind CSS
 * Observability Dashboard - Dark theme based design system for professional engineers
 */

import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// ============ Color Palette ============

export const darkPalette = {
  // Primary (Purple - AI, 핵심)
  purple: {
    900: '#3D1F5C',
    700: '#6B3FA0',
    600: '#7E5BB5',
    500: '#8B5CF6',
    300: '#C9A5F4',
    50: '#F6ECFF',
  },
  // Secondary (Cyan - 데이터, 강조)
  cyan: {
    900: '#164E63',
    700: '#06B6D4',
    600: '#14B8A6',
    500: '#22D3EE',
    300: '#67E8F9',
    50: '#ECFDFD',
  },
  // Semantic Colors (상태)
  success: '#10B981',  // Emerald
  warning: '#F59E0B',  // Amber
  error: '#EF4444',    // Red
  info: '#3B82F6',     // Blue
  // Neutral (회색)
  neutral: {
    950: '#0B1020',    // 최상단 배경
    900: '#121A2B',    // 카드, 섹션
    800: '#1F2937',    // 호버, div
    700: '#374151',    // 테두리
    600: '#4B5563',
    500: '#6B7280',
    400: '#9CA3AF',    // 약한 텍스트
    300: '#D1D5DB',
    200: '#E5E7EB',    // 강한 텍스트 (다크모드)
    100: '#F3F4F6',
    50: '#F9FAFB',     // 라이트모드 배경
  },
};

export const lightPalette = {
  purple: {
    900: '#6B21A8',
    700: '#7E22CE',
    600: '#9333EA',
    500: '#A855F7',
    300: '#D8B4FE',
    50: '#FAF5FF',
  },
  cyan: {
    900: '#164E63',
    700: '#0891B2',
    600: '#06B6D4',
    500: '#22D3EE',
    300: '#67E8F9',
    50: '#ECFDFD',
  },
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  neutral: {
    950: '#030712',
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E2E8F0',
    100: '#F1F5F9',
    50: '#F8FAFC',
  },
};

// ============ Typography Sizes ============

export const typographySizes = {
  display: { fontSize: '32px', fontWeight: 700, lineHeight: 1.2 },
  h1: { fontSize: '24px', fontWeight: 600, lineHeight: 1.3 },
  h2: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
  h3: { fontSize: '14px', fontWeight: 600, lineHeight: 1.4 },
  bodyLarge: { fontSize: '16px', fontWeight: 400, lineHeight: 1.5 },
  body: { fontSize: '14px', fontWeight: 400, lineHeight: 1.5 },
  bodySmall: { fontSize: '12px', fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: '11px', fontWeight: 400, lineHeight: 1.4 },
  mono: { fontSize: '13px', fontWeight: 500, lineHeight: 1.4, fontFamily: '"Monaco", "Courier New", monospace' },
};

// ============ Spacing Grid (8px base) ============

export const spacing = (factor: number) => `${factor * 8}px`;

// ============ Color Palette Exports for Tailwind ============

export const colors = {
  dark: darkPalette,
  light: lightPalette,
};

// ============ MUI Theme Factory ============

export const getAppTheme = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            primary: {
              main: '#9333ea',
              light: '#c084fc',
              dark: '#7e22ce',
            },
            secondary: {
              main: '#22D3EE',
              light: '#67E8F9',
              dark: '#06B6D4',
            },
            background: {
              default: '#0a0f1a',
              paper: '#0f172a',
            },
            text: {
              primary: '#e2e8f0',
              secondary: '#cbd5e1',
            },
            divider: '#1E293B',
            error: {
              main: '#ef4444',
              light: '#f87171',
              dark: '#dc2626',
            },
            warning: {
              main: '#f59e0b',
              light: '#fbbf24',
              dark: '#d97706',
            },
            info: {
              main: '#3b82f6',
              light: '#60a5fa',
              dark: '#2563eb',
            },
            success: {
              main: '#10b981',
              light: '#6ee7b7',
              dark: '#059669',
            },
            action: {
              active: '#9333ea',
              hover: '#1e293b',
              selected: '#0f172a',
              disabled: '#64748b',
            },
          }
        : {
            primary: {
              main: '#9333ea',
              light: '#a855f7',
              dark: '#7e22ce',
            },
            secondary: {
              main: '#22D3EE',
              light: '#67E8F9',
              dark: '#0891B2',
            },
            background: {
              default: '#f8fafc',
              paper: '#ffffff',
            },
            text: {
              primary: '#000000',
              secondary: '#64748b',
            },
            divider: '#e2e8f0',
            error: {
              main: '#dc2626',
              light: '#f87171',
              dark: '#991b1b',
            },
            warning: {
              main: '#d97706',
              light: '#fbbf24',
              dark: '#92400e',
            },
            info: {
              main: '#2563eb',
              light: '#60a5fa',
              dark: '#1e40af',
            },
            success: {
              main: '#059669',
              light: '#6ee7b7',
              dark: '#065f46',
            },
            action: {
              active: '#9333ea',
              hover: '#f1f5f9',
              selected: '#f8fafc',
              disabled: '#94a3b8',
            },
          }),
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.mode === 'dark' ? '#475569' : '#cbd5e1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
              color: theme.palette.text.primary,
            },
          }),
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
          }),
          head: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
            color: theme.palette.text.primary,
            fontWeight: 700,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
              borderColor: theme.palette.primary.main,
            },
          }),
        },
      },
    },
    typography: {
      fontFamily: '"Inter", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
      h1: { fontSize: '2rem', fontWeight: 600 },
      h2: { fontSize: '1.5rem', fontWeight: 600 },
      h3: { fontSize: '1.25rem', fontWeight: 600 },
      h4: { fontSize: '1rem', fontWeight: 600 },
      h5: { fontSize: '0.875rem', fontWeight: 600 },
      h6: { fontSize: '0.75rem', fontWeight: 600 },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
      caption: { fontSize: '0.75rem' },
      subtitle1: { fontSize: '1rem', fontWeight: 500 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    },
    shape: {
      borderRadius: 4,
    },
  });
};

const themeConfig = {
  darkPalette,
  lightPalette,
  typographySizes,
  spacing,
  colors,
};

export default themeConfig;