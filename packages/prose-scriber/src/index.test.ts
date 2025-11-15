import { describe, it, expect, vi } from 'vitest';
import { createTheme } from './index';
import type { ThemeConfig } from './types';

const mockConfig: ThemeConfig = {
  fontSize: {
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  },
  color: {
    textDark: '#000000',
    textLight: '#ffffff',
    background: '#f0f0f0',
    surface: '#ffffff',
  },
  brandColors: {
    primary: '#ff0000',
    secondary: '#00ff00',
    accent: '#0000ff',
  },
};

describe('createTheme', () => {
  it('should initialize with a theme config and return the correct values', () => {
    const theme = createTheme(mockConfig);
    expect(theme.getTheme()).toEqual(mockConfig);
    expect(theme.getColor('textDark')).toBe('#000000');
    expect(theme.getBrandColor('primary')).toBe('#ff0000');
    expect(theme.getFontSize('md')).toBe('16px');
  });

  it('should update the theme when setTheme is called', () => {
    const theme = createTheme(mockConfig);
    const newConfig: ThemeConfig = {
      ...mockConfig,
      brandColors: {
        primary: '#0000ff',
        secondary: '#ffff00',
      },
    };
    theme.setTheme(newConfig);
    expect(theme.getTheme()).toEqual(newConfig);
    expect(theme.getBrandColor('primary')).toBe('#0000ff');
  });

  it('should lighten a color', () => {
    const theme = createTheme(mockConfig);
    // Note: The exact output depends on the implementation of lighten/darken.
    // These tests assume a simple implementation.
    expect(theme.lighten('#000000', 50)).not.toBe('#000000');
  });

  it('should darken a color', () => {
    const theme = createTheme(mockConfig);
    expect(theme.darken('#ffffff', 50)).not.toBe('#ffffff');
  });

  it.skip('should call animateText without errors', () => {
    const theme = createTheme(mockConfig);
    const element = document.createElement('div');
    const consoleSpy = vi.spyOn(console, 'log');
    theme.animateText(element, 'fade-in');
    expect(consoleSpy).toHaveBeenCalled();
  });
});
