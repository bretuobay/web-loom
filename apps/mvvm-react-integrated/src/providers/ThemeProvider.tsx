import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createTheme, applyTheme, setTheme } from '@web-loom/design-core/utils';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) return savedTheme;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Initialize themes on mount
    const initializeThemes = async () => {
      // Create dark theme with flat design principles
      const darkTheme = createTheme('dark', {
        colors: {
          // Background colors - flat, no gradients
          background: {
            page: '#1a1a1a',
            surface: '#242424',
            elevated: '#2d2d2d',
            hover: '#333333',
          },
          // Text colors - high contrast for flat design
          text: {
            primary: '#e8e8e8',
            secondary: '#b0b0b0',
            muted: '#808080',
            inverse: '#1a1a1a',
          },
          // Brand colors - vibrant and flat
          brand: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            tertiary: '#06b6d4',
          },
          // Semantic colors - flat with good contrast
          success: {
            default: '#10b981',
            light: '#34d399',
            dark: '#059669',
          },
          warning: {
            default: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
          },
          danger: {
            default: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
          },
          info: {
            default: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
          },
          // Border colors - subtle but visible
          border: {
            default: '#404040',
            subtle: '#333333',
            strong: '#525252',
          },
        },
        // Flat shadows - minimal depth
        shadows: {
          none: 'none',
          xs: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        },
      });

      // Create light theme with flat design principles
      const lightTheme = createTheme('light', {
        colors: {
          // Background colors - clean and flat
          background: {
            page: '#ffffff',
            surface: '#f9fafb',
            elevated: '#f3f4f6',
            hover: '#e5e7eb',
          },
          // Text colors - strong contrast
          text: {
            primary: '#111827',
            secondary: '#4b5563',
            muted: '#9ca3af',
            inverse: '#ffffff',
          },
          // Brand colors - same as dark for consistency
          brand: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            tertiary: '#06b6d4',
          },
          // Semantic colors
          success: {
            default: '#10b981',
            light: '#d1fae5',
            dark: '#065f46',
          },
          warning: {
            default: '#f59e0b',
            light: '#fef3c7',
            dark: '#92400e',
          },
          danger: {
            default: '#ef4444',
            light: '#fee2e2',
            dark: '#991b1b',
          },
          info: {
            default: '#3b82f6',
            light: '#dbeafe',
            dark: '#1e3a8a',
          },
          // Border colors
          border: {
            default: '#e5e7eb',
            subtle: '#f3f4f6',
            strong: '#d1d5db',
          },
        },
        // Flat shadows - very subtle
        shadows: {
          none: 'none',
          xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        },
      });

      // Apply both themes
      await applyTheme(darkTheme);
      await applyTheme(lightTheme);

      // Set initial theme
      setTheme(theme);
    };

    initializeThemes();
  }, []);

  useEffect(() => {
    // Update theme when state changes
    setTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>{children}</ThemeContext.Provider>;
};
