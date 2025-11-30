import React, { createContext, useContext } from 'react';
import type { ZodSchema } from 'zod';
import type { FormContextValue } from '../types';
import { useFormState } from '../hooks/useFormState';

/**
 * Props for FormProvider component
 */
export interface FormProviderProps<TSchema extends ZodSchema = ZodSchema> {
  form: any; // FormInstance type
  children: React.ReactNode;
}

// Create form context
const FormContext = createContext<FormContextValue | null>(null);

/**
 * Form provider component for sharing form instance across components
 */
export function FormProvider<TSchema extends ZodSchema = ZodSchema>({ form, children }: FormProviderProps<TSchema>) {
  const formState = useFormState(form);

  const contextValue: FormContextValue<TSchema> = {
    form,
    formState,
  };

  return <FormContext.Provider value={contextValue as FormContextValue}>{children}</FormContext.Provider>;
}

/**
 * Hook to access form context
 */
export function useFormContext<TSchema extends ZodSchema = ZodSchema>(): FormContextValue<TSchema> {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }

  return context as FormContextValue<TSchema>;
}
