import type { CSSProperties, FormEventHandler, ReactNode } from 'react';
import type { FieldRenderProps, UseFormReturn } from '@web-loom/forms-react';
import type { FormInstance, InferFormOutput, InferFormValues } from '@web-loom/forms-core';
import type { ZodSchema } from 'zod';

export type FormLayout = 'horizontal' | 'vertical' | 'inline';
export type LabelAlign = 'left' | 'right';
export type RequiredMark = boolean | 'optional';

export interface FormErrorInfo<TSchema extends ZodSchema = ZodSchema> {
  values: InferFormValues<TSchema>;
  errors: Record<string, string>;
}

export interface FormProps<TSchema extends ZodSchema = ZodSchema> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onFinish' | 'onSubmit'
> {
  form: UseFormReturn<TSchema>;
  layout?: FormLayout;
  colon?: boolean;
  labelAlign?: LabelAlign;
  requiredMark?: RequiredMark;
  onFinish?: (values: InferFormOutput<TSchema>, form?: FormInstance<InferFormValues<TSchema>>) => Promise<void> | void;
  onFinishFailed?: (errorInfo: FormErrorInfo<TSchema>) => void;
  name?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export interface FormLayoutContextValue {
  layout: FormLayout;
  colon: boolean;
  labelAlign: LabelAlign;
  requiredMark: RequiredMark;
}

export interface FormProviderContextValue {
  onFormFinish?: (formName: string | undefined, values: Record<string, unknown>) => void;
  onFormFinishFailed?: (formName: string | undefined, info: FormErrorInfo) => void;
}

export interface FormProviderProps {
  children: ReactNode;
  onFormFinish?: (formName: string | undefined, values: Record<string, unknown>) => void;
  onFormFinishFailed?: (formName: string | undefined, info: FormErrorInfo) => void;
}

export interface FormItemRule {
  required?: boolean;
  message?: string;
  trigger?: 'change' | 'blur' | 'submit';
  validator?: (
    value: unknown,
    context: { values: Record<string, unknown> },
  ) => boolean | string | null | Promise<boolean | string | null>;
}

export interface FormItemMeta {
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  error: string | null;
  value: unknown;
  disabled: boolean;
}

export interface FormItemRenderProps {
  name?: string;
  field: FieldRenderProps;
  meta: FormItemMeta;
  error?: string | null;
  descriptionId?: string;
  errorId?: string;
}

export interface FormItemProps {
  label?: ReactNode;
  name?: string;
  children?: React.ReactNode | ((props: FormItemRenderProps) => React.ReactNode);
  colon?: boolean;
  labelAlign?: LabelAlign;
  description?: ReactNode;
  help?: ReactNode;
  required?: boolean;
  rules?: FormItemRule[];
  className?: string;
  style?: CSSProperties;
  error?: string | null;
}

export interface FormListField<T extends unknown = Record<string, unknown>> {
  id: string;
  key: string;
  [key: string]: unknown;
}

export interface FormListOperations {
  append: (value: unknown) => void;
  prepend: (value: unknown) => void;
  insert: (index: number, value: unknown) => void;
  remove: (index: number) => void;
  move: (fromIndex: number, toIndex: number) => void;
  swap: (indexA: number, indexB: number) => void;
  replace: (items: unknown[]) => void;
  clear: () => void;
}

export interface FormListProps {
  name: string;
  children: (fields: FormListField[], operations: FormListOperations) => React.ReactNode;
  className?: string;
  style?: CSSProperties;
}
