import { createContext, useContext, useMemo } from 'react';
import type { FormProviderContextValue, FormProviderProps } from './types';

const FormProviderBridgeContext = createContext<FormProviderContextValue | null>(null);

export function FormProvider({ children, onFormFinish, onFormFinishFailed }: FormProviderProps) {
  const contextValue = useMemo<FormProviderContextValue>(
    () => ({ onFormFinish, onFormFinishFailed }),
    [onFormFinish, onFormFinishFailed],
  );

  return <FormProviderBridgeContext.Provider value={contextValue}>{children}</FormProviderBridgeContext.Provider>;
}

export function useFormProviderContext(): FormProviderContextValue | null {
  return useContext(FormProviderBridgeContext);
}
