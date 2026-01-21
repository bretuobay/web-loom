import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { z } from 'zod';
import { ErrorsContainer } from './ErrorsContainer';
import { AsyncErrorsContainer } from './AsyncErrorsContainer';
import { validateWithZodContainer, validateFieldWithZodContainer } from './zodHelpers';

interface TestForm {
  username: string;
  email: string;
  password: string;
}

describe('ErrorsContainer', () => {
  let container: ErrorsContainer<TestForm>;

  beforeEach(() => {
    container = new ErrorsContainer<TestForm>();
  });

  describe('setErrors/getErrors', () => {
    it('should set and get errors for a property', () => {
      container.setErrors('username', ['Username is required']);
      expect(container.getErrors('username')).toEqual(['Username is required']);
    });

    it('should clear errors when setting empty array', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('username', []);
      expect(container.getErrors('username')).toEqual([]);
    });

    it('should support multiple errors per property', () => {
      container.setErrors('password', ['Too short', 'Needs number']);
      expect(container.getErrors('password')).toEqual(['Too short', 'Needs number']);
    });

    it('should return empty array for property with no errors', () => {
      expect(container.getErrors('email')).toEqual([]);
    });
  });

  describe('hasErrors', () => {
    it('should be false initially', () => {
      expect(container.hasErrors).toBe(false);
    });

    it('should be true when errors exist', () => {
      container.setErrors('username', ['Error']);
      expect(container.hasErrors).toBe(true);
    });

    it('should be false after clearing all errors', () => {
      container.setErrors('username', ['Error']);
      container.clearErrors();
      expect(container.hasErrors).toBe(false);
    });
  });

  describe('hasPropertyErrors', () => {
    it('should return false for property with no errors', () => {
      expect(container.hasPropertyErrors('username')).toBe(false);
    });

    it('should return true for property with errors', () => {
      container.setErrors('username', ['Error']);
      expect(container.hasPropertyErrors('username')).toBe(true);
    });
  });

  describe('getErrors$', () => {
    it('should emit current errors immediately', async () => {
      container.setErrors('email', ['Invalid email']);
      const errors = await firstValueFrom(container.getErrors$('email'));
      expect(errors).toEqual(['Invalid email']);
    });

    it('should emit when errors change', async () => {
      const errorsPromise = firstValueFrom(
        container.getErrors$('email').pipe(take(3), toArray())
      );

      container.setErrors('email', ['Error 1']);
      container.setErrors('email', ['Error 2']);

      const emissions = await errorsPromise;
      expect(emissions).toEqual([[], ['Error 1'], ['Error 2']]);
    });

    it('should not emit duplicate values', async () => {
      const emissions: string[][] = [];
      const sub = container.getErrors$('email').subscribe(e => emissions.push(e));

      container.setErrors('email', ['Error']);
      container.setErrors('email', ['Error']);

      sub.unsubscribe();

      // Should only have initial [] and one ['Error']
      expect(emissions.length).toBe(2);
    });
  });

  describe('getFirstError$', () => {
    it('should emit null when no errors', async () => {
      const error = await firstValueFrom(container.getFirstError$('username'));
      expect(error).toBeNull();
    });

    it('should emit first error when multiple exist', async () => {
      container.setErrors('password', ['Error 1', 'Error 2']);
      const error = await firstValueFrom(container.getFirstError$('password'));
      expect(error).toBe('Error 1');
    });
  });

  describe('hasPropertyErrors$', () => {
    it('should emit false initially', async () => {
      const hasErrors = await firstValueFrom(container.hasPropertyErrors$('username'));
      expect(hasErrors).toBe(false);
    });

    it('should emit true when errors are set', async () => {
      const promise = firstValueFrom(
        container.hasPropertyErrors$('username').pipe(take(2), toArray())
      );

      container.setErrors('username', ['Error']);

      const emissions = await promise;
      expect(emissions).toEqual([false, true]);
    });
  });

  describe('hasErrors$', () => {
    it('should emit false initially', async () => {
      const hasErrors = await firstValueFrom(container.hasErrors$);
      expect(hasErrors).toBe(false);
    });

    it('should emit true when any errors exist', async () => {
      const promise = firstValueFrom(
        container.hasErrors$.pipe(take(2), toArray())
      );

      container.setErrors('username', ['Error']);

      const emissions = await promise;
      expect(emissions).toEqual([false, true]);
    });
  });

  describe('getAllErrors', () => {
    it('should return empty array when no errors', () => {
      expect(container.getAllErrors()).toEqual([]);
    });

    it('should return all errors as flat array', () => {
      container.setErrors('username', ['Error 1', 'Error 2']);
      container.setErrors('email', ['Error 3']);

      const allErrors = container.getAllErrors();
      expect(allErrors).toHaveLength(3);
      expect(allErrors).toContain('Error 1');
      expect(allErrors).toContain('Error 2');
      expect(allErrors).toContain('Error 3');
    });
  });

  describe('getAllErrorsAsRecord', () => {
    it('should return empty object when no errors', () => {
      expect(container.getAllErrorsAsRecord()).toEqual({});
    });

    it('should return errors grouped by property', () => {
      container.setErrors('username', ['Error 1']);
      container.setErrors('email', ['Error 2', 'Error 3']);

      const record = container.getAllErrorsAsRecord();
      expect(record).toEqual({
        username: ['Error 1'],
        email: ['Error 2', 'Error 3']
      });
    });
  });

  describe('getPropertiesWithErrors', () => {
    it('should return empty array when no errors', () => {
      expect(container.getPropertiesWithErrors()).toEqual([]);
    });

    it('should return properties that have errors', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('password', ['Error']);

      const props = container.getPropertiesWithErrors();
      expect(props).toHaveLength(2);
      expect(props).toContain('username');
      expect(props).toContain('password');
    });
  });

  describe('clearErrors', () => {
    it('should clear specific property errors', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('email', ['Error']);
      container.clearErrors('username');

      expect(container.getErrors('username')).toEqual([]);
      expect(container.getErrors('email')).toEqual(['Error']);
    });

    it('should clear all errors when no property specified', () => {
      container.setErrors('username', ['Error']);
      container.setErrors('email', ['Error']);
      container.clearErrors();

      expect(container.hasErrors).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      container.setErrors('username', ['Error']);
      container.dispose();

      expect(container.hasErrors).toBe(false);
    });
  });
});

describe('AsyncErrorsContainer', () => {
  let container: AsyncErrorsContainer<TestForm>;

  beforeEach(() => {
    container = new AsyncErrorsContainer<TestForm>();
  });

  describe('validateAsync', () => {
    it('should set errors from async validator', async () => {
      await container.validateAsync(
        'email',
        'test@test.com',
        async () => ['Email already exists']
      );

      expect(container.getErrors('email')).toEqual(['Email already exists']);
    });

    it('should clear errors when validator returns empty array', async () => {
      container.setErrors('email', ['Old error']);

      await container.validateAsync(
        'email',
        'test@test.com',
        async () => []
      );

      expect(container.getErrors('email')).toEqual([]);
    });

    it('should track validating state', async () => {
      let wasValidating = false;

      const validationPromise = container.validateAsync(
        'email',
        'test@test.com',
        async () => {
          wasValidating = container.isPropertyValidating('email');
          await new Promise(resolve => setTimeout(resolve, 10));
          return [];
        }
      );

      await validationPromise;
      expect(wasValidating).toBe(true);
      expect(container.isPropertyValidating('email')).toBe(false);
    });

    it('should emit isValidating$ observable', async () => {
      const emissions: boolean[] = [];
      const sub = container.isValidating$.subscribe(v => emissions.push(v));

      await container.validateAsync(
        'email',
        'test@test.com',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return [];
        }
      );

      sub.unsubscribe();

      expect(emissions).toContain(true);
      expect(emissions[emissions.length - 1]).toBe(false);
    });
  });

  describe('validateAsyncDebounced', () => {
    it('should debounce validation calls', async () => {
      const validator = vi.fn(async () => []);

      const cancel1 = container.validateAsyncDebounced('email', 'test1', validator, 50);
      const cancel2 = container.validateAsyncDebounced('email', 'test2', validator, 50);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Only the last call should execute
      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith('test2');
    });

    it('should allow cancellation', async () => {
      const validator = vi.fn(async () => []);

      const cancel = container.validateAsyncDebounced('email', 'test', validator, 50);
      cancel();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('cancelPendingValidation', () => {
    it('should cancel pending validation for property', async () => {
      const validator = vi.fn(async () => []);

      container.validateAsyncDebounced('email', 'test', validator, 50);
      container.cancelPendingValidation('email');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('cancelAllPendingValidations', () => {
    it('should cancel all pending validations', async () => {
      const validator = vi.fn(async () => []);

      container.validateAsyncDebounced('email', 'test1', validator, 50);
      container.validateAsyncDebounced('username', 'test2', validator, 50);
      container.cancelAllPendingValidations();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('validatingProperties$', () => {
    it('should emit properties being validated', async () => {
      const emissions: Array<Array<keyof TestForm>> = [];
      const sub = container.validatingProperties$.subscribe(v => emissions.push(v));

      await container.validateAsync(
        'email',
        'test@test.com',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return [];
        }
      );

      sub.unsubscribe();

      expect(emissions.some(e => e.includes('email'))).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should cancel pending validations on dispose', async () => {
      const validator = vi.fn(async () => []);

      container.validateAsyncDebounced('email', 'test', validator, 50);
      container.dispose();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(validator).not.toHaveBeenCalled();
    });
  });
});

describe('Zod Integration', () => {
  const schema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });

  describe('validateWithZodContainer', () => {
    it('should populate errors from Zod validation', () => {
      const container = new ErrorsContainer<TestForm>();
      const isValid = validateWithZodContainer(container, schema, {
        username: 'ab',
        email: 'invalid',
        password: '123',
      });

      expect(isValid).toBe(false);
      expect(container.getErrors('username')).toContain('Username must be at least 3 characters');
      expect(container.getErrors('email')).toContain('Invalid email format');
      expect(container.getErrors('password')).toContain('Password must be at least 8 characters');
    });

    it('should clear errors when validation passes', () => {
      const container = new ErrorsContainer<TestForm>();
      container.setErrors('username', ['Old error']);

      const isValid = validateWithZodContainer(container, schema, {
        username: 'validuser',
        email: 'valid@email.com',
        password: 'validpassword123',
      });

      expect(isValid).toBe(true);
      expect(container.hasErrors).toBe(false);
    });
  });

  describe('validateFieldWithZodContainer', () => {
    it('should validate single field', () => {
      const container = new ErrorsContainer<TestForm>();
      const isValid = validateFieldWithZodContainer(
        container,
        schema,
        'email',
        'invalid',
        { username: 'valid', email: '', password: '12345678' }
      );

      expect(isValid).toBe(false);
      expect(container.getErrors('email')).toContain('Invalid email format');
      expect(container.getErrors('username')).toEqual([]); // Not validated
    });

    it('should clear field errors when valid', () => {
      const container = new ErrorsContainer<TestForm>();
      container.setErrors('email', ['Old error']);

      const isValid = validateFieldWithZodContainer(
        container,
        schema,
        'email',
        'valid@email.com',
        { username: 'valid', email: '', password: '12345678' }
      );

      expect(isValid).toBe(true);
      expect(container.getErrors('email')).toEqual([]);
    });
  });
});
