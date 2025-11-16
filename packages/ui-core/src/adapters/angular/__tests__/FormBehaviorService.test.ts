import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormBehaviorService } from '../index';
import { firstValueFrom } from 'rxjs';

describe('FormBehaviorService', () => {
  let service: FormBehaviorService<{ email: string; password: string }>;

  beforeEach(() => {
    service = new FormBehaviorService();
  });

  describe('initialization', () => {
    it('should initialize with initial values', () => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      const state = service.getState();
      expect(state.values).toEqual({ email: '', password: '' });
      expect(state.errors).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
      expect(state.isValid).toBe(true);
      expect(state.isSubmitting).toBe(false);
      expect(state.submitCount).toBe(0);
    });

    it('should initialize with field configurations', () => {
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
      });

      const state = service.getState();
      expect(state.values).toEqual({ email: '', password: '' });
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      const state = await firstValueFrom(service.getState$());
      expect(state.values).toEqual({ email: '', password: '' });
    });

    it('should emit state updates when setting field value', (done) => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.values.email).toBe('test@example.com');
          expect(state.dirty.email).toBe(true);
          done();
        }
      });

      service.actions.setFieldValue('email', 'test@example.com');
    });
  });

  describe('field value management', () => {
    it('should set field value and mark as dirty', () => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      service.actions.setFieldValue('email', 'test@example.com');

      const state = service.getState();
      expect(state.values.email).toBe('test@example.com');
      expect(state.dirty.email).toBe(true);
    });

    it('should set field touched state', () => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      service.actions.setFieldTouched('email', true);

      const state = service.getState();
      expect(state.touched.email).toBe(true);
    });

    it('should not mark field as dirty if value equals initial value', () => {
      service.initialize({
        initialValues: { email: 'initial@example.com', password: '' },
      });

      service.actions.setFieldValue('email', 'test@example.com');
      expect(service.getState().dirty.email).toBe(true);

      service.actions.setFieldValue('email', 'initial@example.com');
      expect(service.getState().dirty.email).toBe(false);
    });
  });

  describe('synchronous validation', () => {
    it('should validate field with synchronous validator', async () => {
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
      });

      await service.actions.validateField('email');

      const state = service.getState();
      expect(state.errors.email).toBe('Email is required');
      expect(state.isValid).toBe(false);
    });

    it('should clear error when field becomes valid', async () => {
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
      });

      await service.actions.validateField('email');
      expect(service.getState().errors.email).toBe('Email is required');

      service.actions.setFieldValue('email', 'test@example.com');
      await service.actions.validateField('email');

      const state = service.getState();
      expect(state.errors.email).toBeUndefined();
      expect(state.isValid).toBe(true);
    });
  });

  describe('asynchronous validation', () => {
    it('should validate field with asynchronous validator', async () => {
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: async (value) => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return value ? null : 'Email is required';
            },
          },
        },
      });

      await service.actions.validateField('email');

      const state = service.getState();
      expect(state.errors.email).toBe('Email is required');
      expect(state.isValid).toBe(false);
    });

    it('should set isValidating during async validation', (done) => {
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: async (value) => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return null;
            },
          },
        },
      });

      let wasValidating = false;
      service.getState$().subscribe((state) => {
        if (state.isValidating) {
          wasValidating = true;
        }
        if (!state.isValidating && wasValidating) {
          expect(wasValidating).toBe(true);
          done();
        }
      });

      service.actions.validateField('email');
    });
  });

  describe('form validation', () => {
    it('should validate all fields', async () => {
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
          password: {
            validate: (value) => (value.length >= 8 ? null : 'Password too short'),
          },
        },
      });

      const isValid = await service.actions.validateForm();

      expect(isValid).toBe(false);
      const state = service.getState();
      expect(state.errors.email).toBe('Email is required');
      expect(state.errors.password).toBe('Password too short');
    });

    it('should return true when all fields are valid', async () => {
      service.initialize({
        initialValues: { email: 'test@example.com', password: 'password123' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
          password: {
            validate: (value) => (value.length >= 8 ? null : 'Password too short'),
          },
        },
      });

      const isValid = await service.actions.validateForm();

      expect(isValid).toBe(true);
      expect(service.getState().errors).toEqual({});
    });
  });

  describe('form submission', () => {
    it('should validate before submitting', async () => {
      const onSubmit = vi.fn();
      service.initialize({
        initialValues: { email: '', password: '' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
        onSubmit,
      });

      await service.actions.submitForm();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(service.getState().submitCount).toBe(1);
    });

    it('should call onSubmit when form is valid', async () => {
      const onSubmit = vi.fn();
      service.initialize({
        initialValues: { email: 'test@example.com', password: 'password123' },
        fields: {
          email: {
            validate: (value) => (value ? null : 'Email is required'),
          },
        },
        onSubmit,
      });

      await service.actions.submitForm();

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      service.initialize({
        initialValues: { email: 'test@example.com', password: 'password123' },
        onSubmit,
      });

      const submitPromise = service.actions.submitForm();

      // Check isSubmitting is true during submission
      expect(service.getState().isSubmitting).toBe(true);

      await submitPromise;

      // Check isSubmitting is false after submission
      expect(service.getState().isSubmitting).toBe(false);
    });
  });

  describe('form reset', () => {
    it('should reset form to initial values', () => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      service.actions.setFieldValue('email', 'test@example.com');
      service.actions.setFieldTouched('email', true);

      service.actions.resetForm();

      const state = service.getState();
      expect(state.values).toEqual({ email: '', password: '' });
      expect(state.errors).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
      expect(state.submitCount).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should invoke onValuesChange callback', () => {
      const onValuesChange = vi.fn();
      service.initialize({
        initialValues: { email: '', password: '' },
        onValuesChange,
      });

      service.actions.setFieldValue('email', 'test@example.com');

      expect(onValuesChange).toHaveBeenCalledTimes(1);
      expect(onValuesChange).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '',
      });
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      service.ngOnDestroy();

      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should complete Observable on destroy', (done) => {
      service.initialize({
        initialValues: { email: '', password: '' },
      });

      service.getState$().subscribe({
        next: () => {},
        complete: () => {
          done();
        },
      });

      service.ngOnDestroy();
    });
  });
});
