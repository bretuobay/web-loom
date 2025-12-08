/**
 * ThemeProvider Storybook Stories
 *
 * Demonstrates theme provider functionality and theme switching
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from './ThemeProvider';
import { useTheme, useIsDarkMode, useToggleTheme } from '../hooks/useTheme';
import { Button } from '../components/button';
import { Card } from '../components/card';

const meta: Meta<typeof ThemeProvider> = {
  title: 'Providers/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

/**
 * Demo component showing theme usage
 */
function ThemeDemo() {
  const { theme, mode, setMode } = useTheme();
  const isDark = useIsDarkMode();
  const toggleTheme = useToggleTheme();

  return (
    <div style={{ padding: '40px', minWidth: '500px' }}>
      <Card title="Theme Demo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4>Current Theme Mode</h4>
            <p>
              Mode: <strong>{mode}</strong>
            </p>
            <p>
              Is Dark: <strong>{isDark ? 'Yes' : 'No'}</strong>
            </p>
          </div>

          <div>
            <h4>Theme Controls</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button onClick={() => setMode('light')} variant={mode === 'light' ? 'primary' : 'default'}>
                Light Mode
              </Button>
              <Button onClick={() => setMode('dark')} variant={mode === 'dark' ? 'primary' : 'default'}>
                Dark Mode
              </Button>
              <Button onClick={() => setMode('auto')} variant={mode === 'auto' ? 'primary' : 'default'}>
                Auto Mode
              </Button>
              <Button onClick={toggleTheme}>Toggle Theme</Button>
            </div>
          </div>

          <div>
            <h4>Color Tokens</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <ColorSwatch label="Primary" colorKey="colorPrimary" />
              <ColorSwatch label="Success" colorKey="colorSuccess" />
              <ColorSwatch label="Warning" colorKey="colorWarning" />
              <ColorSwatch label="Error" colorKey="colorError" />
              <ColorSwatch label="Info" colorKey="colorInfo" />
              <ColorSwatch label="Text" colorKey="colorText" />
            </div>
          </div>

          <div>
            <h4>Component Styles</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="primary">Primary</Button>
              <Button variant="default">Default</Button>
              <Button variant="dashed">Dashed</Button>
            </div>
          </div>

          <div>
            <h4>CSS Variables</h4>
            <pre
              style={{
                fontSize: '12px',
                padding: '12px',
                background: 'var(--ui-color-bg-secondary)',
                borderRadius: 'var(--ui-radius-md)',
                overflow: 'auto',
                maxHeight: '200px',
              }}
            >
              <code>
                --ui-color-primary: {theme.token.colorPrimary}
                {'\n'}
                --ui-color-success: {theme.token.colorSuccess}
                {'\n'}
                --ui-color-text: {theme.token.colorText}
                {'\n'}
                --ui-space-md: {theme.token.spaceMD}
                {'\n'}
                --ui-radius-md: {theme.token.radiusMD}
              </code>
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Color swatch component
 */
function ColorSwatch({ label, colorKey }: { label: string; colorKey: string }) {
  const { theme } = useTheme();
  const color = theme.token[colorKey as keyof typeof theme.token] as string;

  return (
    <div>
      <div
        style={{
          width: '100%',
          height: '40px',
          backgroundColor: color,
          borderRadius: '4px',
          border: '1px solid var(--ui-color-border)',
        }}
      />
      <div style={{ fontSize: '12px', marginTop: '4px' }}>
        <strong>{label}</strong>
        <br />
        <code style={{ fontSize: '10px' }}>{color}</code>
      </div>
    </div>
  );
}

/**
 * Default theme provider story
 */
export const Default: Story = {
  render: () => (
    <ThemeProvider mode="light">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

/**
 * Dark theme story
 */
export const DarkTheme: Story = {
  render: () => (
    <ThemeProvider mode="dark">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

/**
 * Auto theme (system preference) story
 */
export const AutoTheme: Story = {
  render: () => (
    <ThemeProvider mode="auto">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

/**
 * Custom theme story
 */
export const CustomTheme: Story = {
  render: () => (
    <ThemeProvider
      mode="light"
      theme={{
        token: {
          colorPrimary: '#9333ea',
          colorPrimaryHover: '#a855f7',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
        },
      }}
    >
      <ThemeDemo />
    </ThemeProvider>
  ),
};

/**
 * Interactive theme switcher
 */
export const Interactive: Story = {
  render: () => (
    <ThemeProvider mode="light">
      <ThemeDemo />
    </ThemeProvider>
  ),
};
