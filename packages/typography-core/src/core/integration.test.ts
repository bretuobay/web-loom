import { describe, it, expect } from 'vitest';
import {
  consumeDesignTokens,
  createThemeFromDesignCore,
  generatePresetsFromTokens,
  validateTypographyTokens,
} from './integration';

const mockTokens = {
  typography: {
    font: {
      family: {
        base: { value: 'Inter', type: 'fontFamily' },
        heading: { value: 'Poppins', type: 'fontFamily' },
      },
      size: {
        sm: { value: '14px', type: 'fontSize' },
        md: { value: '16px', type: 'fontSize' },
        lg: { value: '20px', type: 'fontSize' },
        '3xl': { value: '36px', type: 'fontSize' },
      },
      weight: {
        regular: { value: '400', type: 'fontWeight' },
        bold: { value: '700', type: 'fontWeight' },
      },
    },
    lineHeight: {
      normal: { value: '1.5', type: 'lineHeight' },
    },
    letterSpacing: {
      normal: { value: '0px', type: 'letterSpacing' },
    },
  },
};

describe('consumeDesignTokens', () => {
  it('creates a normalized typography configuration', () => {
    const config = consumeDesignTokens(mockTokens);
    expect(config.families.base).toBe('Inter');
    expect(config.fontSizes.md).toBe(16);
    expect(config.lineHeights.normal).toBe(1.5);
  });
});

describe('generatePresetsFromTokens', () => {
  it('produces modular scale and fluid presets', () => {
    const presets = generatePresetsFromTokens(mockTokens);
    expect(presets.modularScale.values.length).toBeGreaterThan(0);
    expect(presets.fluid.body.startsWith('clamp(')).toBe(true);
  });
});

describe('validateTypographyTokens', () => {
  it('validates presence of required tokens', () => {
    const validation = validateTypographyTokens(mockTokens);
    expect(validation.valid).toBe(true);
  });
});

describe('createThemeFromDesignCore', () => {
  it('generates a typography snapshot from a theme', () => {
    const snapshot = createThemeFromDesignCore({ name: 'light', tokens: mockTokens });
    expect(snapshot.name).toBe('light');
    expect(snapshot.config.families.heading).toBe('Poppins');
    expect(snapshot.presets.fluid.heading).toContain('clamp');
  });
});
