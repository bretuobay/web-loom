import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { ThemeProvider, useTheme } from './ThemeProvider';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should default to light theme when no preference is saved', () => {
      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('light');
    });

    it('should use saved theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');
    });

    it('should render children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Test Child</div>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return theme context', () => {
      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('toggleTheme');
      expect(result.current).toHaveProperty('setThemeMode');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle between light and dark themes', () => {
      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Initial state
      expect(result.current.theme).toBe('light');

      // Toggle to dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');

      // Toggle back to light
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('light');
    });

    it('should persist theme to localStorage', () => {
      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('theme')).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('setThemeMode', () => {
    it('should set theme to specified mode', () => {
      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setThemeMode('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setThemeMode('light');
      });
      expect(result.current.theme).toBe('light');
    });

    it('should persist theme mode to localStorage', () => {
      const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setThemeMode('dark');
      });

      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });
});
