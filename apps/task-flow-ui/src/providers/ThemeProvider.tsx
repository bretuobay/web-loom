import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyTheme, createTheme, setTheme } from '@web-loom/design-core/utils';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'taskflow-ui-theme';

const fallbackTheme = 'light' as ThemeMode;

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return fallbackTheme;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return fallbackTheme;
  });
  const [themesLoaded, setThemesLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeThemes = async () => {
      const darkTheme = createTheme('dark', {
        colors: {
          background: {
            page: '#050609',
            surface: '#0d0f14',
            elevated: '#11141b',
          },
          text: {
            primary: '#f3f4f6',
            secondary: '#d6d9e1',
            inverse: '#0c0f14',
          },
          brand: {
            primary: '#f6f7fb',
            secondary: '#e2e6f0',
          },
          success: { default: '#10b981' },
          warning: { default: '#fbbf24' },
          danger: { default: '#ef4444' },
          border: {
            default: 'rgba(187, 192, 201, 0.5)',
          },
        },
        shadow: {
          sm: '0 2px 15px rgba(0, 0, 0, 0.45)',
          md: '0 15px 30px rgba(0, 0, 0, 0.55)',
        },
      });

      const lightTheme = createTheme('light', {
        colors: {
          background: {
            page: '#f6f8fb',
            surface: '#ffffff',
            elevated: '#f3f4f6',
          },
          text: {
            primary: '#111827',
            secondary: '#475467',
            inverse: '#ffffff',
          },
          brand: {
            primary: '#2563eb',
            secondary: '#9333ea',
          },
          success: { default: '#10b981' },
          warning: { default: '#f59e0b' },
          danger: { default: '#dc2626' },
          border: {
            default: 'rgba(15, 23, 42, 0.15)',
          },
        },
        shadow: {
          sm: '0 1px 6px rgba(15, 23, 42, 0.15)',
          md: '0 10px 20px rgba(15, 23, 42, 0.15)',
        },
      });

      await applyTheme(darkTheme);
      await applyTheme(lightTheme);

      if (!mounted) {
        return;
      }

      setTheme(theme);
      setThemesLoaded(true);
    };

    initializeThemes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!themesLoaded) {
      return;
    }

    setTheme(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, themesLoaded]);

  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  const setThemeMode = (mode: ThemeMode) => setThemeState(mode);

  return <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>{children}</ThemeContext.Provider>;
};
