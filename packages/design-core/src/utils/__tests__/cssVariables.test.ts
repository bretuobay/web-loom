// packages/design-core/src/utils/__tests__/cssVariables.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pathToCssVar,
  getTokenVar,
  getSafeTokenVar,
  generateCssVariablesMap,
  generateCssVariablesString,
} from '../cssVariables';
import * as _tokens from '../tokens'; // Import all exports

// Mock the tokens module
vi.mock('../tokens', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getTokenValue: vi.fn(),
    getAllTokens: vi.fn(),
  };
});

// Typed access to the mocked functions
const mockedGetTokenValue = vi.mocked(_tokens.getTokenValue);
const mockedGetAllTokens = vi.mocked(_tokens.getAllTokens);

describe('CSS Variable Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pathToCssVar', () => {
    it('should convert a dot-separated path to a CSS variable name', () => {
      expect(pathToCssVar('colors.primary.main')).toBe('--colors-primary-main');
      expect(pathToCssVar('spacing.1')).toBe('--spacing-1');
      expect(pathToCssVar('typography.heading.h1.fontSize')).toBe('--typography-heading-h1-fontSize');
    });

    it('should handle single-segment paths', () => {
      expect(pathToCssVar('opacity')).toBe('--opacity');
    });

    it('should handle empty string (though unlikely input)', () => {
      expect(pathToCssVar('')).toBe('--');
    });
  });

  describe('getTokenVar', () => {
    it('should return the var() string for a given token path', () => {
      expect(getTokenVar('colors.primary.main')).toBe('var(--colors-primary-main)');
      expect(getTokenVar('spacing.1')).toBe('var(--spacing-1)');
    });
  });

  describe('getSafeTokenVar', () => {
    it('should return the var() string if the token exists', async () => {
      mockedGetTokenValue.mockResolvedValueOnce('#FFFFFF');
      const result = await getSafeTokenVar('colors.white');
      expect(result).toBe('var(--colors-white)');
      expect(mockedGetTokenValue).toHaveBeenCalledWith('colors.white');
    });

    it('should return undefined if the token does not exist', async () => {
      mockedGetTokenValue.mockResolvedValueOnce(undefined);
      const result = await getSafeTokenVar('colors.nonexistent');
      expect(result).toBeUndefined();
      expect(mockedGetTokenValue).toHaveBeenCalledWith('colors.nonexistent');
    });
  });

  describe('generateCssVariablesMap', () => {
    it('should generate a flat map of CSS variables from tokens', async () => {
      const mockTokens = {
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
        },
        spacing: {
          small: '8px',
          medium: '16px',
          nested: {
            deep: '4px',
          },
        },
      };
      mockedGetAllTokens.mockResolvedValue(mockTokens);

      const expectedMap = {
        '--colors-primary': '#007bff',
        '--colors-secondary': '#6c757d',
        '--spacing-small': '8px',
        '--spacing-medium': '16px',
        '--spacing-nested-deep': '4px',
      };
      const result = await generateCssVariablesMap();
      expect(result).toEqual(expectedMap);
    });

    it('should return an empty map if no tokens are present', async () => {
      mockedGetAllTokens.mockResolvedValue({});
      const result = await generateCssVariablesMap();
      expect(result).toEqual({});
    });
  });

  describe('generateCssVariablesString', () => {
    it.skip('should generate a CSS string with variables under the specified selector', async () => {
      // Instead of mocking generateCssVariablesMap, we can rely on its test via getAllTokens mock
      const mockTokensForString = {
        colors: { primary: 'blue' },
        spacing: { small: '5px' },
      };
      mockedGetAllTokens.mockResolvedValue(mockTokensForString); // generateCssVariablesMap uses getAllTokens

      const result = await generateCssVariablesString(':root');
      const expectedStringLines = [':root {', '  --colors-primary: blue;', '  --spacing-small: 5px;', '}'];
      // Normalize whitespace and line breaks for comparison
      expect(result.replace(/\s+/g, ' ').trim()).toBe(expectedStringLines.join(' ').trim());
    });

    it('should use :root as the default selector', async () => {
      mockedGetAllTokens.mockResolvedValue({ colors: { accent: 'red' } });
      const result = await generateCssVariablesString(); // Default selector
      expect(result.startsWith(':root {')).toBe(true);
    });

    it('should return an empty selector block if no variables are generated', async () => {
      mockedGetAllTokens.mockResolvedValue({});
      const result = await generateCssVariablesString('.my-scope');
      expect(result.replace(/\s+/g, '')).toBe('.my-scope{}'); // Trim whitespace
    });
  });
});
