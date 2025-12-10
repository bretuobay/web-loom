/**
 * Token Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  mapDesignTokensToCSS,
  getCSSVarName,
  getCSSVarRef,
  mergeTokens,
  getComponentTokens,
  createComponentVars,
} from './tokens';

describe('Token Utilities', () => {
  describe('mapDesignTokensToCSS', () => {
    it('should convert tokens to CSS variables', () => {
      const tokens = {
        colorPrimary: '#1677ff',
        fontSize: '14px',
      };

      const result = mapDesignTokensToCSS(tokens);

      expect(result).toEqual({
        '--ui-color-primary': '#1677ff',
        '--ui-font-size': '14px',
      });
    });

    it('should use custom prefix', () => {
      const tokens = { colorPrimary: '#1677ff' };
      const result = mapDesignTokensToCSS(tokens, 'wl');

      expect(result).toEqual({
        '--wl-color-primary': '#1677ff',
      });
    });

    it('should skip undefined and null values', () => {
      const tokens = {
        colorPrimary: '#1677ff',
        colorSecondary: undefined,
        colorTertiary: null,
      } as any;

      const result = mapDesignTokensToCSS(tokens);

      expect(result).toEqual({
        '--ui-color-primary': '#1677ff',
      });
    });
  });

  describe('getCSSVarName', () => {
    it('should convert camelCase to CSS variable name', () => {
      expect(getCSSVarName('colorPrimary')).toBe('--ui-color-primary');
      expect(getCSSVarName('fontSize')).toBe('--ui-font-size');
      expect(getCSSVarName('borderRadius')).toBe('--ui-border-radius');
    });

    it('should use custom prefix', () => {
      expect(getCSSVarName('colorPrimary', 'wl')).toBe('--wl-color-primary');
    });
  });

  describe('getCSSVarRef', () => {
    it('should create CSS variable reference', () => {
      expect(getCSSVarRef('colorPrimary')).toBe('var(--ui-color-primary)');
    });

    it('should include fallback value', () => {
      expect(getCSSVarRef('colorPrimary', '#1677ff')).toBe('var(--ui-color-primary, #1677ff)');
    });

    it('should use custom prefix', () => {
      expect(getCSSVarRef('colorPrimary', undefined, 'wl')).toBe('var(--wl-color-primary)');
    });
  });

  describe('mergeTokens', () => {
    it('should merge tokens with override', () => {
      const defaults = {
        colorPrimary: '#1677ff',
        colorSuccess: '#52c41a',
        fontSize: '14px',
      };

      const custom = {
        colorPrimary: '#ff0000',
        fontSize: '16px',
      };

      const result = mergeTokens(defaults, custom);

      expect(result).toEqual({
        colorPrimary: '#ff0000',
        colorSuccess: '#52c41a',
        fontSize: '16px',
      });
    });

    it('should return defaults when no custom tokens', () => {
      const defaults = { colorPrimary: '#1677ff' };
      const result = mergeTokens(defaults);

      expect(result).toEqual(defaults);
    });

    it('should handle empty custom tokens', () => {
      const defaults = { colorPrimary: '#1677ff' };
      const result = mergeTokens(defaults, {});

      expect(result).toEqual(defaults);
    });
  });

  describe('getComponentTokens', () => {
    it('should extract component tokens', () => {
      const allTokens = {
        components: {
          Button: {
            height: '32px',
            paddingX: '16px',
          },
        },
      };

      const result = getComponentTokens(allTokens, 'Button');

      expect(result).toEqual({
        height: '32px',
        paddingX: '16px',
      });
    });

    it('should return empty object when no component tokens', () => {
      const allTokens = { components: {} };
      const result = getComponentTokens(allTokens, 'Button');

      expect(result).toEqual({});
    });

    it('should return empty object when components not defined', () => {
      const allTokens = {};
      const result = getComponentTokens(allTokens, 'Button');

      expect(result).toEqual({});
    });
  });

  describe('createComponentVars', () => {
    it('should create component-scoped CSS variables', () => {
      const tokens = {
        height: '32px',
        paddingX: '16px',
        borderRadius: '6px',
      };

      const result = createComponentVars('Button', tokens);

      expect(result).toEqual({
        '--ui-button-height': '32px',
        '--ui-button-padding-x': '16px',
        '--ui-button-border-radius': '6px',
      });
    });

    it('should use custom prefix', () => {
      const tokens = { height: '32px' };
      const result = createComponentVars('Button', tokens, 'wl');

      expect(result).toEqual({
        '--wl-button-height': '32px',
      });
    });

    it('should handle uppercase component names', () => {
      const tokens = { height: '32px' };
      const result = createComponentVars('MyButton', tokens);

      expect(result).toEqual({
        '--ui-mybutton-height': '32px',
      });
    });

    it('should skip undefined and null values', () => {
      const tokens = {
        height: '32px',
        paddingX: undefined,
        paddingY: null,
      } as any;

      const result = createComponentVars('Button', tokens);

      expect(result).toEqual({
        '--ui-button-height': '32px',
      });
    });
  });
});
