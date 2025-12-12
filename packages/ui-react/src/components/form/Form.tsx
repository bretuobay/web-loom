import {
  forwardRef,
  useCallback,
  useMemo,
  type FormEvent,
  type FormEventHandler,
  type ForwardedRef,
} from 'react';
import type { ZodSchema } from 'zod';
import { FormProvider as ReactFormProvider } from '@web-loom/forms-react';
import { cn } from '../../utils/cn';
import styles from './Form.module.css';
import { FormLayoutContext } from './FormContext';
import { useFormProviderContext } from './FormProvider';
import { useForm } from '@web-loom/forms-react';
import type { InferFormValues } from '@web-loom/forms-core';
import type { FormProps } from './types';
import { FormItem } from './Form.Item';
import { FormList } from './Form.List';
import { FormProvider } from './FormProvider';

type FormComponentType<TSchema extends ZodSchema = ZodSchema> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<FormProps<TSchema>> & React.RefAttributes<HTMLFormElement>
> & {
  Item: typeof FormItem;
  List: typeof FormList;
  Provider: typeof FormProvider;
  useForm: typeof useForm;
};

function createErrorInfo<TSchema extends ZodSchema>(
  form: FormProps<TSchema>['form'],
): { values: InferFormValues<TSchema>; errors: Record<string, string> } {
  return {
    values: form.values,
    errors: form.errors,
  };
}

function useNativeOnSubmit(onSubmit?: FormEventHandler<HTMLFormElement>) {
  return useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      if (!event) return;
      onSubmit?.(event);
      event.preventDefault();
      event.stopPropagation();
    },
    [onSubmit],
  );
}

function BaseForm<TSchema extends ZodSchema>(props: FormProps<TSchema>, ref: ForwardedRef<HTMLFormElement>) {
  const {
    form,
    layout = 'vertical',
    colon = true,
    labelAlign = 'right',
    requiredMark = true,
    onFinish,
    onFinishFailed,
    name,
    className,
    children,
    onSubmit,
    ...nativeProps
  } = props;

  const { onFormFinish, onFormFinishFailed } = useFormProviderContext() ?? {};
  const nativeOnSubmit = useNativeOnSubmit(onSubmit);
  const layoutContextValue = useMemo(
    () => ({
      layout,
      colon,
      labelAlign,
      requiredMark,
    }),
    [layout, colon, labelAlign, requiredMark],
  );

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      nativeOnSubmit(event);
      const values = form.values;
      const isValid = await form.validate();
      const errorInfo = createErrorInfo(form);

      if (isValid) {
        try {
          await onFinish?.(values, form.form);
          onFormFinish?.(name, values);
        } catch (errorInfo) {
          onFinishFailed?.(createErrorInfo(form));
          onFormFinishFailed?.(name, createErrorInfo(form));
          console.error('Form submission error', errorInfo);
        }
        return;
      }

      onFinishFailed?.(errorInfo);
      onFormFinishFailed?.(name, errorInfo);
    },
    [form, name, nativeOnSubmit, onFinish, onFinishFailed, onFormFinish, onFormFinishFailed],
  );

  const mergedClassName = cn(
    styles.form,
    layout === 'horizontal' && styles.layoutHorizontal,
    layout === 'inline' && styles.layoutInline,
    className,
  );

  return (
    <ReactFormProvider form={form.form}>
      <FormLayoutContext.Provider value={layoutContextValue}>
        <form ref={ref} className={mergedClassName} onSubmit={handleSubmit} {...nativeProps}>
          {children}
        </form>
      </FormLayoutContext.Provider>
    </ReactFormProvider>
  );
}

const FormComponent = forwardRef(BaseForm) as FormComponentType;

FormComponent.Item = FormItem;
FormComponent.List = FormList;
FormComponent.Provider = FormProvider;
FormComponent.useForm = useForm;
FormComponent.displayName = 'Form';

export { FormComponent as Form };
