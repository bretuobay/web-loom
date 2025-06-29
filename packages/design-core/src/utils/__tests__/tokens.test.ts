// packages/design-core/src/utils/__tests__/tokens.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllTokens, getTokenValue } from '../tokens';

// Mock the token files that are dynamically imported
vi.mock('../tokens/colors.json', () => ({
  default: {
    base: {
      primary: { value: '#1E40AF', type: 'color' },
      secondary: { value: '#64748B', type: 'color' },
    },
    text: {
      default: { value: '{colors.base.primary.value}', type: 'color' }, // Reference
    },
    themed: {
      light: {
        background: { value: '#FFFFFF', type: 'color' },
        text: { value: '#000000', type: 'color' },
      },
      dark: {
        background: { value: '#111111', type: 'color' },
        text: { value: '#EEEEEE', type: 'color' },
      },
    },
  },
}));

vi.mock('../tokens/spacing.json', () => ({
  default: {
    '0': { value: '0px', type: 'spacing' },
    '1': { value: '4px', type: 'spacing' },
    gutter: { value: '{spacing.1.value}', type: 'spacing' }, // Reference
  },
}));

// Mock other token files with basic structure to prevent import errors
vi.mock('../tokens/borders.json', () => ({
  default: {
    width: { '1': { value: '1px', type: 'borderWidth' } },
  },
}));
vi.mock('../tokens/breakpoints.json', () => ({
  default: {
    sm: { value: '640px', type: 'breakpoint' },
  },
}));
vi.mock('../tokens/cursor-styles.json', () => ({
  default: {
    pointer: { value: 'pointer', type: 'cursor' },
  },
}));
vi.mock('../tokens/focus-rings.json', () => ({
  default: {
    default: { value: '2px solid blue', type: 'focusRing' },
  },
}));
vi.mock('../tokens/gradients.json', () => ({
  default: {
    primary: { value: 'linear-gradient(45deg, #1E40AF, #64748B)', type: 'gradient' },
  },
}));
vi.mock('../tokens/opacity.json', () => ({
  default: {
    '50': { value: '0.5', type: 'opacity' },
  },
}));
vi.mock('../tokens/radii.json', () => ({
  default: {
    sm: { value: '4px', type: 'borderRadius' },
  },
}));
vi.mock('../tokens/shadows.json', () => ({
  default: {
    sm: { value: '0 1px 3px rgba(0, 0, 0, 0.1)', type: 'boxShadow' },
  },
}));
vi.mock('../tokens/sizing.json', () => ({
  default: {
    sm: { value: '16px', type: 'sizing' },
  },
}));
vi.mock('../tokens/timing.json', () => ({
  default: {
    fast: { value: '150ms', type: 'duration' },
  },
}));
vi.mock('../tokens/transitions.json', () => ({
  default: {
    default: { value: 'all 150ms ease', type: 'transition' },
  },
}));
vi.mock('../tokens/typography.json', () => ({
  default: {
    body: { value: '16px', type: 'fontSize' },
  },
}));
vi.mock('../tokens/z-index.json', () => ({
  default: {
    modal: { value: '1000', type: 'zIndex' },
  },
}));

describe('Design Token Utilities', () => {
  // Reset modules before each test to clear cache and re-initialize masterTokens
  beforeEach(() => {
    // This is a way to reset the internal state of tokens.ts if it caches.
    // Vitest's vi.resetModules() can help here.
    // We need to ensure `initializeMasterTokens` can be called again or its state reset.
    // For this test, we'll rely on the fact that `initializeMasterTokens` only runs once
    // due to `masterTokensInitialized` flag. We need a way to reset this flag or the module itself.
    // The most robust way is to use vi.resetModules() and re-import.
    // However, let's try to test as is first, assuming dynamic imports are fresh on each 'await import'.
    // If `masterTokensInitialized` is a problem, we'd need to export a reset function from tokens.ts (not ideal)
    // or use vi.resetModules more carefully.
    // For simplicity in this context, we assume the mocks apply cleanly for each test run.
    // A more advanced setup might involve `vi.resetModules` before each test and then
    // re-importing `getAllTokens` and `getTokenValue` within the test or a setup block.
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clear mocks after each test
    // vi.resetModules(); // Could be used if module state needs full reset.
  });

  describe('getAllTokens', () => {
    it('should load and process all token categories', async () => {
      const tokens = await getAllTokens();
      expect(tokens).toBeTypeOf('object');
      expect(tokens.colors).toBeDefined();
      expect(tokens.spacing).toBeDefined();
      expect(tokens.borders).toBeDefined(); // Expect empty object from mock
    });

    it('should correctly extract values from token objects', async () => {
      const tokens = await getAllTokens();
      // Type assertions to help TypeScript understand the nested structure
      expect((tokens.colors as any).base.primary).toBe('#1E40AF');
      expect((tokens.spacing as any)['0']).toBe('0px');
    });

    it('should resolve references within the same category', async () => {
      const tokens = await getAllTokens();
      expect(tokens.spacing.gutter).toBe('4px'); // Resolved from {spacing.1.value}
    });

    it('should resolve references across categories (if colors.text.default refers to colors.base.primary)', async () => {
      const tokens = await getAllTokens();
      // This depends on the exact structure of `masterTokens` after processing.
      // `colors.text.default` refers to `colors.base.primary.value`
      expect((tokens.colors as any).text.default).toBe('#1E40AF');
    });
  });

  describe('getTokenValue', () => {
    it('should return the correct value for a valid path', async () => {
      const primaryColor = await getTokenValue('colors.base.primary');
      expect(primaryColor).toBe('#1E40AF');
    });

    it('should return undefined for an invalid path', async () => {
      const nonExistent = await getTokenValue('colors.base.nonexistent');
      expect(nonExistent).toBeUndefined();
    });

    it('should return undefined for a path that is partially correct but ultimately invalid', async () => {
      const nonExistent = await getTokenValue('colors.nonexistent.token');
      expect(nonExistent).toBeUndefined();
    });

    it('should return a value that was resolved from a reference', async () => {
      const gutterValue = await getTokenValue('spacing.gutter');
      expect(gutterValue).toBe('4px');
      const defaultTextColor = await getTokenValue('colors.text.default');
      expect(defaultTextColor).toBe('#1E40AF');
    });

    it('should return deeply nested theme values', async () => {
      const darkBg = await getTokenValue('colors.themed.dark.background');
      expect(darkBg).toBe('#111111');
    });

    it('should return undefined for an empty path', async () => {
      const value = await getTokenValue('');
      expect(value).toBeUndefined();
    });

    it('should return the group object if path points to a category group rather than a leaf node', async () => {
      // The current implementation of getTokenValue returns the object/group if the path doesn't resolve to a primitive.
      // TokenValue is string | number, so strictly, it should return undefined if it's not a leaf.
      // This test documents the current behavior.
      const result = await getTokenValue('colors.base');
      expect(result).toEqual({ primary: '#1E40AF', secondary: '#64748B' });
    });
  });
});
