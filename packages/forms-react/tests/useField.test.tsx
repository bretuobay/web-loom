import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { vi, expect } from 'vitest';
import { useForm } from '../src/hooks/useForm';
import { useField } from '../src/hooks/useField';
import { FormProvider } from '../src/components/FormProvider';

function createWrapper(form: any) {
  return ({ children }: { children: React.ReactNode }) => <FormProvider form={form}>{children}</FormProvider>;
}

describe('useField', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
  });

  const defaultValues = {
    email: '',
    name: '',
  };

  it('should register field and manage state', () => {
    const { result: formResult } = renderHook(() => useForm({ schema, defaultValues }));

    const wrapper = createWrapper(formResult.current.form);

    const { result } = renderHook(() => useField('email'), { wrapper });

    expect(result.current.value).toBe('');
    expect(result.current.touched).toBe(false);
    expect(result.current.dirty).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update field value', () => {
    const { result: formResult } = renderHook(() => useForm({ schema, defaultValues }));

    const wrapper = createWrapper(formResult.current.form);

    const { result } = renderHook(() => useField<string>('email'), { wrapper });

    act(() => {
      result.current.setValue('test@example.com');
    });

    expect(result.current.value).toBe('test@example.com');
    expect(result.current.dirty).toBe(true);
  });

  it('should handle field validation', async () => {
    const { result: formResult } = renderHook(() => useForm({ schema, defaultValues }));

    const wrapper = createWrapper(formResult.current.form);

    const { result } = renderHook(() => useField<string>('email'), { wrapper });

    act(() => {
      result.current.setValue('invalid-email');
    });

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should handle field blur', () => {
    const { result: formResult } = renderHook(() => useForm({ schema, defaultValues }));

    const wrapper = createWrapper(formResult.current.form);

    const { result } = renderHook(() => useField('email'), { wrapper });

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.touched).toBe(true);
  });

  it('should provide field render props', () => {
    const { result: formResult } = renderHook(() => useForm({ schema, defaultValues }));

    const wrapper = createWrapper(formResult.current.form);

    const { result } = renderHook(() => useField<string>('email'), { wrapper });

    expect(result.current.field).toEqual(
      expect.objectContaining({
        name: 'email',
        value: '',
        onChange: expect.any(Function),
        onBlur: expect.any(Function),
        onFocus: expect.any(Function),
      }),
    );
  });

  it('should handle React change events', () => {
    const { result: formResult } = renderHook(() => useForm({ schema, defaultValues }));

    const wrapper = createWrapper(formResult.current.form);

    const { result } = renderHook(() => useField<string>('email'), { wrapper });

    const mockEvent = {
      target: { value: 'test@example.com' },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.field.onChange(mockEvent);
    });

    expect(result.current.value).toBe('test@example.com');
  });
});
