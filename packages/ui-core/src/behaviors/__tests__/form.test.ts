import { describe, it, expect, vi } from 'vitest';
import { createFormBehavior } from '../form';

describe('createFormBehavior', () => {
  describe('initial state', () => {
    it('should initialize with provided initial values', () => {
      const form = createFormBehavior({
        initialValues: {
          email: '',
          password: '',
          age: 0,
        },
      });

      const state = form.getState();

      expect(state.values).toEqual({
        email: '',
        password: '',
        age: 0,
      });
      expect(state.errors).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
      expect(state.isValidating).toBe(false);
      expect(state.isValid).toBe(true);
      expect(state.isSubmitting).toBe(false);
      expect(state.submitCount).toBe(0);
    });

    it('should initialize with empty object when no initial values provided', () => {
      const form = createFormBehavior({
        initialValues: {},
      });

      const state = form.getState();

      expect(state.values).toEqual({});
      expect(state.isValid).toBe(true);
    });
  });

  describe('setFieldValue action', () => {
    it('should update field value correctly', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
      });

      form.actions.setFieldValue('email', 'test@example.com');

      const state = form.getState();

      expect(state.values.email).toBe('test@example.com');
      expect(state.values.password).toBe('');
    });

    it('should mark field as dirty when value changes from initial', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
      });

      form.actions.setFieldValue('email', 'test@example.com');
      const state = form.getState();

      expect(state.dirty.email).toBe(true);
      expect(state.dirty.password).toBeUndefined();
    });

    it('should mark field as not dirty when value returns to initial', () => {
      const form = createFormBehavior({
        initialValues: { email: 'initial@example.com' },
      });

      // Change value
      form.actions.setFieldValue('email', 'changed@example.com');
      expect(form.getState().dirty.email).toBe(true);

      // Return to initial value
      form.actions.setFieldValue('email', 'initial@example.com');
      expect(form.getState().dirty.email).toBe(false);
    });

    it('should invoke onValuesChange callback when value changes', () => {
      const onValuesChange = vi.fn();
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
        onValuesChange,
      });

      form.actions.setFieldValue('email', 'test@example.com');

      expect(onValuesChange).toHaveBeenCalledTimes(1);
      expect(onValuesChange).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '',
      });
    });

    it('should trigger validation when validateOnChange is enabled', async () => {
      const validate = vi.fn(() => null);
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: { validate },
        },
        validateOnChange: true,
      });

      form.actions.setFieldValue('email', 'test@example.com');

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(validate).toHaveBeenCalledWith('test@example.com');
    });

    it('should not trigger validation when validateOnChange is disabled', async () => {
      const validate = vi.fn(() => null);
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: { validate },
        },
        validateOnChange: false,
      });

      form.actions.setFieldValue('email', 'test@example.com');

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(validate).not.toHaveBeenCalled();
    });
  });

  describe('setFieldTouched action', () => {
    it('should mark field as touched', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
      });

      form.actions.setFieldTouched('email', true);
      const state = form.getState();

      expect(state.touched.email).toBe(true);
      expect(state.touched.password).toBeUndefined();
    });

    it('should mark field as untouched', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      form.actions.setFieldTouched('email', true);
      expect(form.getState().touched.email).toBe(true);

      form.actions.setFieldTouched('email', false);
      expect(form.getState().touched.email).toBe(false);
    });

    it('should trigger validation when field is touched and validateOnBlur is enabled', async () => {
      const validate = vi.fn(() => null);
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: { validate },
        },
        validateOnBlur: true,
      });

      form.actions.setFieldTouched('email', true);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(validate).toHaveBeenCalledWith('');
    });

    it('should trigger validation by default when field is touched', async () => {
      const validate = vi.fn(() => null);
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: { validate },
        },
      });

      form.actions.setFieldTouched('email', true);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(validate).toHaveBeenCalledWith('');
    });

    it('should not trigger validation when validateOnBlur is disabled', async () => {
      const validate = vi.fn(() => null);
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: { validate },
        },
        validateOnBlur: false,
      });

      form.actions.setFieldTouched('email', true);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(validate).not.toHaveBeenCalled();
    });
  });

  describe('synchronous validation', () => {
    it('should validate field with synchronous validator', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => {
              if (!value) return 'Email is required';
              if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
              return null;
            },
          },
        },
      });

      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBe('Email is required');

      form.actions.setFieldValue('email', 'invalid');
      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBe('Invalid email format');

      form.actions.setFieldValue('email', 'test@example.com');
      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBeUndefined();
      expect(form.getState().isValid).toBe(true);
    });

    it('should clear error when field becomes valid', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
        },
      });

      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBe('Required');

      form.actions.setFieldValue('email', 'test@example.com');
      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBeUndefined();
    });

    it('should update isValid flag based on errors', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
        },
      });

      expect(form.getState().isValid).toBe(true);

      await form.actions.validateField('email');
      expect(form.getState().isValid).toBe(false);

      form.actions.setFieldValue('email', 'test@example.com');
      await form.actions.validateField('email');
      expect(form.getState().isValid).toBe(true);
    });
  });

  describe('asynchronous validation', () => {
    it('should validate field with asynchronous validator', async () => {
      const form = createFormBehavior({
        initialValues: { username: '' },
        fields: {
          username: {
            validate: async (value) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              if (!value) return 'Username is required';
              if (value.length < 3) return 'Username must be at least 3 characters';
              return null;
            },
          },
        },
      });

      await form.actions.validateField('username');
      expect(form.getState().errors.username).toBe('Username is required');

      form.actions.setFieldValue('username', 'ab');
      await form.actions.validateField('username');
      expect(form.getState().errors.username).toBe('Username must be at least 3 characters');

      form.actions.setFieldValue('username', 'validuser');
      await form.actions.validateField('username');
      expect(form.getState().errors.username).toBeUndefined();
    });

    it('should set isValidating flag during async validation', async () => {
      const form = createFormBehavior({
        initialValues: { username: '' },
        fields: {
          username: {
            validate: async (value) => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return value ? null : 'Required';
            },
          },
        },
      });

      const validationPromise = form.actions.validateField('username');

      // Check that isValidating is true during validation
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(form.getState().isValidating).toBe(true);

      await validationPromise;
      expect(form.getState().isValidating).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const form = createFormBehavior({
        initialValues: { field: '' },
        fields: {
          field: {
            validate: async () => {
              throw new Error('Validation error');
            },
          },
        },
      });

      await form.actions.validateField('field');

      expect(form.getState().errors.field).toBe('Validation failed');
      expect(form.getState().isValid).toBe(false);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('validateForm action', () => {
    it('should validate all configured fields', async () => {
      const form = createFormBehavior({
        initialValues: {
          email: '',
          password: '',
          username: '',
        },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email required'),
          },
          password: {
            validate: (value) => (value.length >= 8 ? null : 'Password must be 8+ characters'),
          },
          username: {
            validate: (value) => (value ? null : 'Username required'),
          },
        },
      });

      const isValid = await form.actions.validateForm();

      expect(isValid).toBe(false);
      expect(form.getState().errors.email).toBe('Email required');
      expect(form.getState().errors.password).toBe('Password must be 8+ characters');
      expect(form.getState().errors.username).toBe('Username required');
    });

    it('should return true when all fields are valid', async () => {
      const form = createFormBehavior({
        initialValues: {
          email: 'test@example.com',
          password: 'password123',
        },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
          password: {
            validate: (value) => (value.length >= 8 ? null : 'Too short'),
          },
        },
      });

      const isValid = await form.actions.validateForm();

      expect(isValid).toBe(true);
      expect(form.getState().errors).toEqual({});
      expect(form.getState().isValid).toBe(true);
    });

    it.skip('should validate fields in parallel', async () => {
      const validationTimes: number[] = [];

      const form = createFormBehavior({
        initialValues: { field1: '', field2: '', field3: '' },
        fields: {
          field1: {
            validate: async (value) => {
              const start = Date.now();
              await new Promise((resolve) => setTimeout(resolve, 50));
              validationTimes.push(Date.now() - start);
              return null;
            },
          },
          field2: {
            validate: async (value) => {
              const start = Date.now();
              await new Promise((resolve) => setTimeout(resolve, 50));
              validationTimes.push(Date.now() - start);
              return null;
            },
          },
          field3: {
            validate: async (value) => {
              const start = Date.now();
              await new Promise((resolve) => setTimeout(resolve, 50));
              validationTimes.push(Date.now() - start);
              return null;
            },
          },
        },
      });

      const start = Date.now();
      await form.actions.validateForm();
      const totalTime = Date.now() - start;

      // If run in parallel, total time should be ~50ms, not ~150ms
      expect(totalTime).toBeLessThan(100);
    });

    it('should set isValidating flag during validation', async () => {
      const form = createFormBehavior({
        initialValues: { field: '' },
        fields: {
          field: {
            validate: async () => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return null;
            },
          },
        },
      });

      const validationPromise = form.actions.validateForm();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(form.getState().isValidating).toBe(true);

      await validationPromise;
      expect(form.getState().isValidating).toBe(false);
    });
  });

  describe('resetForm action', () => {
    it('should reset all form state to initial values', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
      });

      // Modify form state
      form.actions.setFieldValue('email', 'test@example.com');
      form.actions.setFieldValue('password', 'password123');
      form.actions.setFieldTouched('email', true);

      // Reset form
      form.actions.resetForm();
      const state = form.getState();

      expect(state.values).toEqual({ email: '', password: '' });
      expect(state.errors).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
      expect(state.isValidating).toBe(false);
      expect(state.isValid).toBe(true);
      expect(state.isSubmitting).toBe(false);
      expect(state.submitCount).toBe(0);
    });

    it('should clear validation errors', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
        },
      });

      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBe('Required');

      form.actions.resetForm();
      expect(form.getState().errors).toEqual({});
      expect(form.getState().isValid).toBe(true);
    });

    it('should reset submit count', async () => {
      const form = createFormBehavior({
        initialValues: { email: 'test@example.com' },
        onSubmit: vi.fn(),
      });

      await form.actions.submitForm();
      expect(form.getState().submitCount).toBe(1);

      form.actions.resetForm();
      expect(form.getState().submitCount).toBe(0);
    });
  });

  describe('submitForm action', () => {
    it('should validate form before submission', async () => {
      const onSubmit = vi.fn();
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
        },
        onSubmit,
      });

      await form.actions.submitForm();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(form.getState().errors.email).toBe('Required');
      expect(form.getState().submitCount).toBe(1);
    });

    it('should call onSubmit when form is valid', async () => {
      const onSubmit = vi.fn();
      const form = createFormBehavior({
        initialValues: { email: 'test@example.com', password: 'password123' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
          password: {
            validate: (value) => (value.length >= 8 ? null : 'Too short'),
          },
        },
        onSubmit,
      });

      await form.actions.submitForm();

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(form.getState().submitCount).toBe(1);
    });

    it('should set isSubmitting flag during submission', async () => {
      const onSubmit = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const form = createFormBehavior({
        initialValues: { email: 'test@example.com' },
        onSubmit,
      });

      const submitPromise = form.actions.submitForm();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(form.getState().isSubmitting).toBe(true);

      await submitPromise;
      expect(form.getState().isSubmitting).toBe(false);
    });

    it('should increment submit count on each submission attempt', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
        },
        onSubmit: vi.fn(),
      });

      expect(form.getState().submitCount).toBe(0);

      await form.actions.submitForm();
      expect(form.getState().submitCount).toBe(1);

      await form.actions.submitForm();
      expect(form.getState().submitCount).toBe(2);

      form.actions.setFieldValue('email', 'test@example.com');
      await form.actions.submitForm();
      expect(form.getState().submitCount).toBe(3);
    });

    it('should handle async onSubmit callback', async () => {
      const onSubmit = vi.fn(async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return values;
      });

      const form = createFormBehavior({
        initialValues: { email: 'test@example.com' },
        onSubmit,
      });

      await form.actions.submitForm();

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(form.getState().isSubmitting).toBe(false);
    });

    it('should handle submission errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const onSubmit = vi.fn(async () => {
        throw new Error('Submission failed');
      });

      const form = createFormBehavior({
        initialValues: { email: 'test@example.com' },
        onSubmit,
      });

      await form.actions.submitForm();

      expect(form.getState().isSubmitting).toBe(false);
      expect(form.getState().submitCount).toBe(1);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('touched and dirty tracking', () => {
    it('should track touched state independently for each field', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '', username: '' },
      });

      form.actions.setFieldTouched('email', true);
      form.actions.setFieldTouched('password', true);

      const state = form.getState();

      expect(state.touched.email).toBe(true);
      expect(state.touched.password).toBe(true);
      expect(state.touched.username).toBeUndefined();
    });

    it('should track dirty state independently for each field', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '', username: '' },
      });

      form.actions.setFieldValue('email', 'test@example.com');
      form.actions.setFieldValue('password', 'password123');

      const state = form.getState();

      expect(state.dirty.email).toBe(true);
      expect(state.dirty.password).toBe(true);
      expect(state.dirty.username).toBeUndefined();
    });

    it('should maintain touched state after value changes', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      form.actions.setFieldTouched('email', true);
      form.actions.setFieldValue('email', 'test@example.com');

      expect(form.getState().touched.email).toBe(true);
    });

    it('should maintain dirty state after field is touched', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      form.actions.setFieldValue('email', 'test@example.com');
      form.actions.setFieldTouched('email', true);

      expect(form.getState().dirty.email).toBe(true);
    });

    it('should clear touched and dirty on reset', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
      });

      form.actions.setFieldValue('email', 'test@example.com');
      form.actions.setFieldTouched('email', true);
      form.actions.setFieldValue('password', 'password123');
      form.actions.setFieldTouched('password', true);

      form.actions.resetForm();

      const state = form.getState();
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when state changes', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });
      const listener = vi.fn();

      form.subscribe(listener);
      form.actions.setFieldValue('email', 'test@example.com');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].values.email).toBe('test@example.com');
    });

    it('should support multiple subscribers', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      form.subscribe(listener1);
      form.subscribe(listener2);

      form.actions.setFieldValue('email', 'test@example.com');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });
      const listener = vi.fn();

      const unsubscribe = form.subscribe(listener);
      unsubscribe();

      form.actions.setFieldValue('email', 'test@example.com');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });
      const listener = vi.fn();

      form.subscribe(listener);
      form.destroy();

      form.actions.setFieldValue('email', 'test@example.com');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      expect(() => {
        form.destroy();
        form.destroy();
      }).not.toThrow();
    });
  });

  describe('setFieldError action', () => {
    it('should set a manual error for a field', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      form.actions.setFieldError('email', 'Email already exists');
      const state = form.getState();

      expect(state.errors.email).toBe('Email already exists');
      expect(state.manualErrors.email).toBe('Email already exists');
      expect(state.isValid).toBe(false);
    });

    it('should clear a manual error when set to null', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      form.actions.setFieldError('email', 'Email already exists');
      expect(form.getState().errors.email).toBe('Email already exists');

      form.actions.setFieldError('email', null);
      const state = form.getState();

      expect(state.errors.email).toBeUndefined();
      expect(state.manualErrors.email).toBeUndefined();
      expect(state.isValid).toBe(true);
    });

    it('should not trigger validation when setting manual error', async () => {
      const validate = vi.fn(() => 'Validation error');
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: { validate },
        },
      });

      form.actions.setFieldError('email', 'Manual error');

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(validate).not.toHaveBeenCalled();
      expect(form.getState().errors.email).toBe('Manual error');
    });

    it('should merge manual errors with validation errors', async () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
      });

      // Set manual error on password
      form.actions.setFieldError('password', 'Password already used');

      // Trigger validation on email
      await form.actions.validateField('email');

      const state = form.getState();

      expect(state.errors.email).toBe('Email is required');
      expect(state.errors.password).toBe('Password already used');
      expect(state.isValid).toBe(false);
    });

    it('should prioritize manual errors over validation errors for the same field', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
      });

      // Trigger validation
      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBe('Email is required');

      // Set manual error
      form.actions.setFieldError('email', 'Email already exists');
      expect(form.getState().errors.email).toBe('Email already exists');
    });

    it('should show validation error after clearing manual error', async () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
      });

      // Trigger validation
      await form.actions.validateField('email');
      expect(form.getState().errors.email).toBe('Email is required');

      // Set manual error (overrides validation error)
      form.actions.setFieldError('email', 'Email already exists');
      expect(form.getState().errors.email).toBe('Email already exists');

      // Clear manual error (validation error should show again)
      form.actions.setFieldError('email', null);
      expect(form.getState().errors.email).toBe('Email is required');
    });

    it('should update isValid flag when setting manual errors', () => {
      const form = createFormBehavior({
        initialValues: { email: '' },
      });

      expect(form.getState().isValid).toBe(true);

      form.actions.setFieldError('email', 'Error');
      expect(form.getState().isValid).toBe(false);

      form.actions.setFieldError('email', null);
      expect(form.getState().isValid).toBe(true);
    });

    it('should clear manual errors on form reset', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
      });

      form.actions.setFieldError('email', 'Email error');
      form.actions.setFieldError('password', 'Password error');

      expect(form.getState().errors.email).toBe('Email error');
      expect(form.getState().errors.password).toBe('Password error');

      form.actions.resetForm();

      const state = form.getState();
      expect(state.errors).toEqual({});
      expect(state.manualErrors).toEqual({});
      expect(state.isValid).toBe(true);
    });

    it('should handle multiple manual errors on different fields', () => {
      const form = createFormBehavior({
        initialValues: { email: '', password: '', username: '' },
      });

      form.actions.setFieldError('email', 'Email error');
      form.actions.setFieldError('password', 'Password error');
      form.actions.setFieldError('username', 'Username error');

      const state = form.getState();

      expect(state.errors.email).toBe('Email error');
      expect(state.errors.password).toBe('Password error');
      expect(state.errors.username).toBe('Username error');
      expect(state.isValid).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete form lifecycle', async () => {
      const onSubmit = vi.fn();
      const onValuesChange = vi.fn();
      const listener = vi.fn();

      const form = createFormBehavior({
        initialValues: {
          email: '',
          password: '',
        },
        fields: {
          email: {
            validate: (value) => {
              if (!value) return 'Email is required';
              if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email';
              return null;
            },
          },
          password: {
            validate: (value) => {
              if (!value) return 'Password is required';
              if (value.length < 8) return 'Password must be 8+ characters';
              return null;
            },
          },
        },
        onSubmit,
        onValuesChange,
      });

      form.subscribe(listener);

      // Fill out form
      form.actions.setFieldValue('email', 'test@example.com');
      expect(onValuesChange).toHaveBeenCalled();
      expect(listener).toHaveBeenCalled();

      form.actions.setFieldValue('password', 'password123');
      form.actions.setFieldTouched('email', true);
      form.actions.setFieldTouched('password', true);

      // Validate
      await form.actions.validateForm();
      expect(form.getState().isValid).toBe(true);

      // Submit
      await form.actions.submitForm();
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      // Clean up
      form.destroy();
    });

    it('should handle validation errors during submission', async () => {
      const onSubmit = vi.fn();

      const form = createFormBehavior({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Required'),
          },
          password: {
            validate: (value) => (value.length >= 8 ? null : 'Too short'),
          },
        },
        onSubmit,
      });

      // Try to submit invalid form
      await form.actions.submitForm();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(form.getState().errors.email).toBe('Required');
      expect(form.getState().errors.password).toBe('Too short');
      expect(form.getState().submitCount).toBe(1);

      // Fix errors and resubmit
      form.actions.setFieldValue('email', 'test@example.com');
      form.actions.setFieldValue('password', 'password123');

      await form.actions.submitForm();

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(form.getState().submitCount).toBe(2);
    });
  });
});
