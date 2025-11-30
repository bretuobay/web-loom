import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { vi, expect } from 'vitest';
import { useForm } from '../src/hooks/useForm';

describe('useForm', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    age: z.number().min(18),
  });

  const defaultValues = {
    email: 'default@example.com',
    name: 'Default User',
    age: 18,
  };

  it('should create form with initial state', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues }));

    expect(result.current.values).toEqual(defaultValues);
    expect(result.current.isValid).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle form submission', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useForm({ schema, defaultValues }));

    const submitHandler = result.current.handleSubmit(onSubmit);

    await act(async () => {
      await submitHandler();
    });

    expect(onSubmit).toHaveBeenCalledWith(defaultValues, result.current.form);
  });

  it('should validate form before submission', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useForm({
        schema,
        defaultValues: {
          email: 'invalid-email',
          name: '',
          age: 15,
        },
      }),
    );

    const submitHandler = result.current.handleSubmit(onSubmit);

    await act(async () => {
      await submitHandler();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.isValid).toBe(false);
  });

  it('should reset form values', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues }));

    act(() => {
      result.current.setValues({ email: 'test@example.com' });
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(defaultValues);
    expect(result.current.isDirty).toBe(false);
  });

  it('should set form values', () => {
    const { result } = renderHook(() => useForm({ schema, defaultValues }));

    act(() => {
      result.current.setValues({
        email: 'test@example.com',
        name: 'John Doe',
      });
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.values.age).toBe(18); // unchanged
  });

  it('should track form validation state', async () => {
    const { result } = renderHook(() =>
      useForm({
        schema,
        defaultValues: {
          email: 'invalid-email',
          name: '',
          age: 15,
        },
      }),
    );

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.isValid).toBe(false);
    expect(Object.keys(result.current.errors)).toHaveLength(3);
  });
});
