/**
 * ThemeProvider Tests
 *
 * Tests for theme provider functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';
import { useTheme, useIsDarkMode, useToggleTheme, useThemeToken } from '../hooks/useTheme';
import { defaultLightTheme, defaultDarkTheme } from './defaultTheme';

describe('ThemeProvider', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Basic Functionality', () => {
    it('should provide theme context', () => {
      function TestComponent() {
        const { theme } = useTheme();
        return <div data-testid="theme-mode">{theme.token.colorPrimary}</div>;
      }

      render(
        <ThemeProvider mode="light">
          <TestComponent />
        </ThemeProvider>
      );

      const element = screen.getByTestId('theme-mode');
      expect(element.textContent).toBe(defaultLightTheme.token.colorPrimary);
    });

    it('should use light theme by default', () => {
      function TestComponent() {
        const { mode } = useTheme();
        return <div data-testid="mode">{mode}</div>;
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('mode').textContent).toBe('light');
    });

    it('should use dark theme when specified', () => {
      function TestComponent() {
        const { theme } = useTheme();
        return <div data-testid="theme-color">{theme.token.colorBg}</div>;
      }

      render(
        <ThemeProvider mode="dark">
          <TestComponent />
        </ThemeProvider>
      );

      const element = screen.getByTestId('theme-color');
      expect(element.textContent).toBe(defaultDarkTheme.token.colorBg);
    });
  });

  describe('CSS Variable Injection', () => {
    it('should inject CSS variables into document element', async () => {
      render(
        <ThemeProvider mode="light" container={container}>
          <div>Test</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        const primaryColor = container.style.getPropertyValue('--ui-color-primary');
        expect(primaryColor).toBeTruthy();
        expect(primaryColor).toBe(defaultLightTheme.token.colorPrimary);
      });
    });

    it('should update CSS variables when theme changes', async () => {
      function TestComponent() {
        const { setMode } = useTheme();
        return <button onClick={() => setMode('dark')}>Switch</button>;
      }

      const { rerender } = render(
        <ThemeProvider mode="light" container={container}>
          <TestComponent />
        </ThemeProvider>
      );

      // Initial light theme
      await waitFor(() => {
        const bgColor = container.style.getPropertyValue('--ui-color-bg');
        expect(bgColor).toBe(defaultLightTheme.token.colorBg);
      });

      // Switch to dark theme
      screen.getByText('Switch').click();

      await waitFor(() => {
        const bgColor = container.style.getPropertyValue('--ui-color-bg');
        expect(bgColor).toBe(defaultDarkTheme.token.colorBg);
      });
    });

    it('should add data-theme attribute', async () => {
      render(
        <ThemeProvider mode="dark" container={container}>
          <div>Test</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(container.getAttribute('data-theme')).toBe('dark');
      });
    });
  });

  describe('useTheme Hook', () => {
    it('should return current theme', () => {
      function TestComponent() {
        const { theme } = useTheme();
        return <div data-testid="primary">{theme.token.colorPrimary}</div>;
      }

      render(
        <ThemeProvider mode="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('primary').textContent).toBe(defaultLightTheme.token.colorPrimary);
    });

    it('should allow theme updates', () => {
      function TestComponent() {
        const { theme, setTheme } = useTheme();
        return (
          <div>
            <div data-testid="color">{theme.token.colorPrimary}</div>
            <button
              onClick={() =>
                setTheme({
                  token: { colorPrimary: '#custom' },
                })
              }
            >
              Update
            </button>
          </div>
        );
      }

      render(
        <ThemeProvider mode="light">
          <TestComponent />
        </ThemeProvider>
      );

      screen.getByText('Update').click();

      expect(screen.getByTestId('color').textContent).toBe('#custom');
    });
  });

  describe('useIsDarkMode Hook', () => {
    it('should return false for light mode', () => {
      function TestComponent() {
        const isDark = useIsDarkMode();
        return <div data-testid="is-dark">{String(isDark)}</div>;
      }

      render(
        <ThemeProvider mode="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('is-dark').textContent).toBe('false');
    });

    it('should return true for dark mode', () => {
      function TestComponent() {
        const isDark = useIsDarkMode();
        return <div data-testid="is-dark">{String(isDark)}</div>;
      }

      render(
        <ThemeProvider mode="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('is-dark').textContent).toBe('true');
    });
  });

  describe('useToggleTheme Hook', () => {
    it('should toggle between light and dark', () => {
      function TestComponent() {
        const { mode } = useTheme();
        const toggle = useToggleTheme();
        return (
          <div>
            <div data-testid="mode">{mode}</div>
            <button onClick={toggle}>Toggle</button>
          </div>
        );
      }

      render(
        <ThemeProvider mode="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('mode').textContent).toBe('light');

      screen.getByText('Toggle').click();
      expect(screen.getByTestId('mode').textContent).toBe('dark');

      screen.getByText('Toggle').click();
      expect(screen.getByTestId('mode').textContent).toBe('light');
    });
  });

  describe('useThemeToken Hook', () => {
    it('should return specific token value', () => {
      function TestComponent() {
        const primaryColor = useThemeToken('colorPrimary');
        return <div data-testid="token">{primaryColor}</div>;
      }

      render(
        <ThemeProvider mode="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('token').textContent).toBe(defaultLightTheme.token.colorPrimary);
    });
  });

  describe('Custom Theme', () => {
    it('should merge custom theme with default theme', () => {
      function TestComponent() {
        const { theme } = useTheme();
        return (
          <div>
            <div data-testid="custom">{theme.token.colorPrimary}</div>
            <div data-testid="default">{theme.token.colorSuccess}</div>
          </div>
        );
      }

      render(
        <ThemeProvider
          mode="light"
          theme={{
            token: { colorPrimary: '#custom-primary' },
          }}
        >
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('custom').textContent).toBe('#custom-primary');
      expect(screen.getByTestId('default').textContent).toBe(defaultLightTheme.token.colorSuccess);
    });
  });
});
