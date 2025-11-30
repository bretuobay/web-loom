import { describe, it, expect } from 'vitest';
import {
  validateWithZod,
  formatZodErrors,
  AsyncValidator,
  debounce,
  validateField,
  mergeValidationErrors,
  hasValidationErrors,
  clearValidationErrors,
} from '../src/validation';
import { z } from 'zod';

describe('Validation Utilities', () => {
  describe('validateWithZod', () => {
    it('should validate successfully with valid data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      const result = validateWithZod(schema, { name: 'John', age: 25 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 25 });
      expect(result.errors.fieldErrors).toEqual({});
      expect(result.errors.formErrors).toEqual([]);
    });

    it('should return validation errors for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      const result = validateWithZod(schema, { name: '', age: -1 });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(Object.keys(result.errors.fieldErrors)).toContain('name');
      expect(Object.keys(result.errors.fieldErrors)).toContain('age');
    });

    it('should handle validation errors gracefully', () => {
      const schema = z.object({
        name: z.string(),
      });

      // Pass invalid input that would cause an error
      const result = validateWithZod(schema, null);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.formErrors.length).toBeGreaterThan(0);
    });
  });

  describe('formatZodErrors', () => {
    it('should format field-level errors correctly', () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18 or older'),
      });

      const parseResult = schema.safeParse({ email: 'invalid', age: 16 });
      if (!parseResult.success) {
        const formatted = formatZodErrors(parseResult.error);

        expect(formatted.fieldErrors.email).toBe('Invalid email');
        expect(formatted.fieldErrors.age).toBe('Must be 18 or older');
        expect(formatted.formErrors).toEqual([]);
      }
    });

    it('should format root-level errors correctly', () => {
      const schema = z.string().min(1, 'Root level error');

      const parseResult = schema.safeParse('');
      if (!parseResult.success) {
        const formatted = formatZodErrors(parseResult.error);

        expect(formatted.fieldErrors).toEqual({});
        expect(formatted.formErrors).toContain('Root level error');
      }
    });
  });

  describe('AsyncValidator', () => {
    it('should validate asynchronously', async () => {
      const validator = new AsyncValidator({
        validator: async (value) => {
          if (value === 'invalid') {
            return 'Value is invalid';
          }
          return null;
        },
      });

      const result1 = await validator.validate('valid');
      expect(result1).toBeNull();

      const result2 = await validator.validate('invalid');
      expect(result2).toBe('Value is invalid');
    });

    it('should handle cancellation', async () => {
      const validator = new AsyncValidator({
        validator: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return 'Should not reach here';
        },
      });

      // Start validation
      const validationPromise = validator.validate('test');

      // Cancel immediately
      validator.cancel();

      const result = await validationPromise;
      expect(result).toBeNull(); // Should return null for cancelled validation
    });

    it('should cache results when enabled', async () => {
      let callCount = 0;
      const validator = new AsyncValidator({
        validator: async (value) => {
          callCount++;
          return value === 'error' ? 'Error message' : null;
        },
        cache: true,
        cacheTTL: 1000,
      });

      // First call
      const result1 = await validator.validate('test');
      expect(result1).toBeNull();
      expect(callCount).toBe(1);

      // Second call with same value should use cache
      const result2 = await validator.validate('test');
      expect(result2).toBeNull();
      expect(callCount).toBe(1); // Should not increment

      // Different value should call validator again
      const result3 = await validator.validate('different');
      expect(result3).toBeNull();
      expect(callCount).toBe(2);
    });

    it('should clear cache', async () => {
      let callCount = 0;
      const validator = new AsyncValidator({
        validator: async () => {
          callCount++;
          return null;
        },
        cache: true,
      });

      await validator.validate('test');
      expect(callCount).toBe(1);

      validator.clearCache();

      await validator.validate('test');
      expect(callCount).toBe(2); // Should call validator again after cache clear
    });

    it('should cleanup properly', () => {
      const validator = new AsyncValidator({
        validator: async () => null,
        cache: true,
      });

      expect(() => validator.destroy()).not.toThrow();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        return callCount;
      };

      const debouncedFn = debounce(fn, 50);

      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      const result = await debouncedFn();

      // Should only execute once
      expect(result).toBe(1);
      expect(callCount).toBe(1);
    });

    it('should handle async functions', async () => {
      let callCount = 0;
      const asyncFn = async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return callCount;
      };

      const debouncedFn = debounce(asyncFn, 50);

      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      const result = await debouncedFn();

      expect(result).toBe(1);
      expect(callCount).toBe(1);
    });

    it('should cancel previous calls', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        return callCount;
      };

      const debouncedFn = debounce(fn, 100);

      // First call
      const promise1 = debouncedFn();

      // Second call should cancel first
      const promise2 = debouncedFn();

      try {
        await promise1;
      } catch (error) {
        expect((error as Error).message).toBe('Debounced call cancelled');
      }

      const result = await promise2;
      expect(result).toBe(1);
      expect(callCount).toBe(1);
    });
  });

  describe('validateField', () => {
    it('should validate top-level fields', () => {
      const schema = z.object({
        name: z.string().min(2, 'Too short'),
      });

      const error1 = validateField(schema, 'name', 'a');
      expect(error1).toBe('Too short');

      const error2 = validateField(schema, 'name', 'John');
      expect(error2).toBeNull();
    });

    it('should validate nested fields', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(2, 'Name too short'),
        }),
      });

      const allValues = { user: { name: 'a' } };
      const error = validateField(schema, 'user.name', 'a', allValues);
      expect(error).toBe('Name too short');
    });

    it('should handle validation errors gracefully', () => {
      const schema = z.object({
        name: z.string(),
      });

      const error = validateField(schema, 'nonexistent', 'value');
      expect(error).toBeNull(); // Should not throw, return null for non-existent fields
    });
  });

  describe('mergeValidationErrors', () => {
    it('should merge field errors', () => {
      const errors1 = {
        fieldErrors: { name: 'Name error', age: 'Age error' },
        formErrors: ['Form error 1'],
      };

      const errors2 = {
        fieldErrors: { email: 'Email error', age: 'Different age error' },
        formErrors: ['Form error 2'],
      };

      const merged = mergeValidationErrors(errors1, errors2);

      expect(merged.fieldErrors).toEqual({
        name: 'Name error',
        age: 'Different age error', // Should be overwritten
        email: 'Email error',
      });

      expect(merged.formErrors).toEqual(['Form error 1', 'Form error 2']);
    });

    it('should not duplicate form errors', () => {
      const errors1 = {
        fieldErrors: {},
        formErrors: ['Duplicate error'],
      };

      const errors2 = {
        fieldErrors: {},
        formErrors: ['Duplicate error', 'Unique error'],
      };

      const merged = mergeValidationErrors(errors1, errors2);

      expect(merged.formErrors).toEqual(['Duplicate error', 'Unique error']);
    });
  });

  describe('hasValidationErrors', () => {
    it('should detect field errors', () => {
      const errors = {
        fieldErrors: { name: 'Error' },
        formErrors: [],
      };

      expect(hasValidationErrors(errors)).toBe(true);
    });

    it('should detect form errors', () => {
      const errors = {
        fieldErrors: {},
        formErrors: ['Error'],
      };

      expect(hasValidationErrors(errors)).toBe(true);
    });

    it('should return false for no errors', () => {
      const errors = {
        fieldErrors: {},
        formErrors: [],
      };

      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('clearValidationErrors', () => {
    it('should clear specified field errors', () => {
      const errors = {
        fieldErrors: {
          name: 'Name error',
          email: 'Email error',
          age: 'Age error',
        },
        formErrors: ['Form error'],
      };

      const cleared = clearValidationErrors(errors, ['name', 'age']);

      expect(cleared.fieldErrors).toEqual({ email: 'Email error' });
      expect(cleared.formErrors).toEqual(['Form error']); // Should preserve form errors
    });

    it('should handle non-existent field paths', () => {
      const errors = {
        fieldErrors: { name: 'Name error' },
        formErrors: [],
      };

      const cleared = clearValidationErrors(errors, ['nonexistent']);

      expect(cleared.fieldErrors).toEqual({ name: 'Name error' });
    });
  });
});
