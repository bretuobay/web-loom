import { createContext, useContext } from 'react';
import type { FormLayoutContextValue } from './types';

export const DEFAULT_FORM_LAYOUT: FormLayoutContextValue = {
  layout: 'vertical',
  colon: true,
  labelAlign: 'right',
  requiredMark: true,
};

export const FormLayoutContext = createContext<FormLayoutContextValue>(DEFAULT_FORM_LAYOUT);

export function useFormLayout(): FormLayoutContextValue {
  return useContext(FormLayoutContext);
}
