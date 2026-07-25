import { createTheme } from '@web-loom/design-core/utils';

export const lightTheme = createTheme('light', {
  colors: {
    background: {
      page: '#f6f8fb',
      surface: '#ffffff',
      elevated: '#eef2f8',
      accent: '#d9e8ff',
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      inverse: '#f9fafb',
    },
    brand: {
      primary: '#0f766e',
      secondary: '#115e59',
      soft: '#ccfbf1',
    },
    border: {
      subtle: '#dbe2ea',
      strong: '#94a3b8',
    },
    state: {
      success: '#15803d',
      warning: '#d97706',
      danger: '#b91c1c',
    },
  },
  spacing: {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radii: {
    sm: '8px',
    md: '14px',
    lg: '20px',
    pill: '999px',
  },
  shadows: {
    card: '0 12px 28px rgba(2, 6, 23, 0.08)',
    soft: '0 6px 16px rgba(15, 23, 42, 0.08)',
  },
});

export const darkTheme = createTheme('dark', {
  colors: {
    background: {
      page: '#0b1220',
      surface: '#111a2a',
      elevated: '#172338',
      accent: '#123242',
    },
    text: {
      primary: '#e5edf9',
      secondary: '#a9b8cc',
      inverse: '#0b1220',
    },
    brand: {
      primary: '#2dd4bf',
      secondary: '#14b8a6',
      soft: '#113c3b',
    },
    border: {
      subtle: '#223047',
      strong: '#3a4a63',
    },
    state: {
      success: '#4ade80',
      warning: '#fb923c',
      danger: '#f87171',
    },
  },
  shadows: {
    card: '0 10px 24px rgba(2, 6, 23, 0.45)',
    soft: '0 4px 14px rgba(15, 23, 42, 0.5)',
  },
});
