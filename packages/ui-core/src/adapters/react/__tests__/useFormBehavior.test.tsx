import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormBehavior } from '../index';

describe('useFormBehavior', () => {
  describe('initial state', () => {
    it('should initialize with provided values', () => {
      const initialValues = { email: '', password: '' };
      const { result } = renderHook(() => 
        useFormBehavior({ initialValues })
      );

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.dirty).toEqual({});
      expect(result.current.isValid).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.submitCount).toBe(0);
    });
  });

  describe('state updates trigger re-renders', () => {
    it('should update component when setting field value', () => {
      const { result } = renderHook(() => 
        useFormBehavior({ initialValues: { email: '' } })
      );

      act(() => {
        result.current.actions.setFieldValue('email', 'test@example.com');
      });

      expect(result.current.values.email).toBe('test@example.com');
      expect(result.current.dirty.email).toBe(true);
    });

    it('should update component when setting field touched', () => {
      const { result } = renderHook(() => 
        useFormBehavior({ initialValues: { email: '' } })
      );

      act(() => {
        result.current.actions.setFieldTouched('email', true);
      });

      expect(result.current.touched.email).toBe(true);
    });

    it('should update component when validating field', async () => {
      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { email: '' },
          fields: {
            email: {
              validate: (value) => {
                if (!value) return 'Email is required';
                return null;
              },
            },
          },
        })
      );

      await act(async () => {
        await result.current.actions.validateField('email');
      });

      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.isValid).toBe(false);
    });

    it('should update component when resetting form', () => {
      const initialValues = { email: '', password: '' };
      const { result } = renderHook(() => 
        useFormBehavior({ initialValues })
      );

      act(() => {
        result.current.actions.setFieldValue('email', 'test@example.com');
        result.current.actions.setFieldTouched('email', true);
      });

      expect(result.current.values.email).toBe('test@example.com');
      expect(result.current.touched.email).toBe(true);

      act(() => {
        result.current.actions.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.touched).toEqual({});
      expect(result.current.dirty).toEqual({});
    });
  });

  describe('validation', () => {
    it('should validate field with synchronous validator', async () => {
      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { email: '' },
          fields: {
            email: {
              validate: (value) => {
                if (!value) return 'Email is required';
                if (!value.includes('@')) return 'Invalid email';
                return null;
              },
            },
          },
        })
      );

      await act(async () => {
        await result.current.actions.validateField('email');
      });

      expect(result.current.errors.email).toBe('Email is required');

      act(() => {
        result.current.actions.setFieldValue('email', 'invalid');
      });

      await act(async () => {
        await result.current.actions.validateField('email');
      });

      expect(result.current.errors.email).toBe('Invalid email');

      act(() => {
        result.current.actions.setFieldValue('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.actions.validateField('email');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('should validate field with asynchronous validator', async () => {
      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { username: '' },
          fields: {
            username: {
              validate: async (value) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                if (!value) return 'Username is required';
                return null;
              },
            },
          },
        })
      );

      await act(async () => {
        await result.current.actions.validateField('username');
      });

      expect(result.current.errors.username).toBe('Username is required');
    });

    it('should validate entire form', async () => {
      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { email: '', password: '' },
          fields: {
            email: {
              validate: (value) => !value ? 'Email is required' : null,
            },
            password: {
              validate: (value) => !value ? 'Password is required' : null,
            },
          },
        })
      );

      await act(async () => {
        const isValid = await result.current.actions.validateForm();
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.errors.password).toBe('Password is required');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('form submission', () => {
    it('should handle form submission', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { email: 'test@example.com' },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.actions.submitForm();
      });

      expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result.current.submitCount).toBe(1);
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { email: 'test@example.com' },
          onSubmit,
        })
      );

      const submitPromise = act(async () => {
        await result.current.actions.submitForm();
      });

      // During submission
      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      // After submission
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should validate before submitting', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => 
        useFormBehavior({
          initialValues: { email: '' },
          fields: {
            email: {
              validate: (value) => !value ? 'Email is required' : null,
            },
          },
          onSubmit,
        })
      );

      await act(async () => {
        await result.current.actions.submitForm();
      });

      // Should not submit if validation fails
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.email).toBe('Email is required');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const { result, unmount } = renderHook(() => 
        useFormBehavior({ initialValues: { email: '' } })
      );

      act(() => {
        result.current.actions.setFieldValue('email', 'test@example.com');
      });

      expect(result.current.values.email).toBe('test@example.com');

      unmount();

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('behavior instance stability', () => {
    it('should maintain same behavior instance across re-renders', () => {
      const { result, rerender } = renderHook(() => 
        useFormBehavior({ initialValues: { email: '' } })
      );

      const firstActions = result.current.actions;

      act(() => {
        result.current.actions.setFieldValue('email', 'test@example.com');
      });

      rerender();

      expect(result.current.actions).toBe(firstActions);
    });
  });
});
