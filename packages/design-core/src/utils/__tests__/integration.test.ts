// packages/design-core/src/utils/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { resolveTokenReferences } from '../tokens';

describe('Token Resolution Integration', () => {
  describe('resolveTokenReferences', () => {
    it('should resolve simple token references', () => {
      const tokens = {
        colors: {
          base: {
            primary: '#007bff',
          },
          brand: {
            main: '{colors.base.primary.value}',
          },
        },
      };

      resolveTokenReferences(tokens);
      expect(tokens.colors.brand.main).toBe('#007bff');
    });

    it('should handle unresolvable references gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const tokens = {
        colors: {
          brand: {
            main: '{colors.nonexistent.value}',
          },
        },
      };

      resolveTokenReferences(tokens);
      expect(tokens.colors.brand.main).toBe('{colors.nonexistent.value}');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token reference "{colors.nonexistent.value}"')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle deeply nested references', () => {
      const tokens = {
        spacing: {
          base: {
            unit: '4px',
          },
          scale: {
            small: '{spacing.base.unit.value}',
            medium: '8px',
          },
          padding: {
            sm: '{spacing.scale.small.value}',
          },
        },
      };

      resolveTokenReferences(tokens);
      expect(tokens.spacing.padding.sm).toBe('4px');
    });

    it('should handle non-string values without errors', () => {
      const tokens = {
        zIndex: {
          modal: 1000,
          tooltip: 2000,
        },
      };

      expect(() => resolveTokenReferences(tokens)).not.toThrow();
      expect(tokens.zIndex.modal).toBe(1000);
    });

    it('should handle empty token objects', () => {
      const tokens = {};
      expect(() => resolveTokenReferences(tokens)).not.toThrow();
    });

    it('should handle tokens with null values', () => {
      const tokens = {
        colors: {
          primary: null,
          secondary: '#fff',
        },
      };

      expect(() => resolveTokenReferences(tokens)).not.toThrow();
    });
  });
});
