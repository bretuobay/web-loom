import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useFormContext } from '../components/FormProvider';
import { useFormSubscription } from './useFormSubscription';
import type { UseFieldConfig, UseFieldReturn, FieldRenderProps } from '../types';

/**
 * React hook for individual field management
 */
export function useField<TValue = unknown>(name: string, config: UseFieldConfig = {}): UseFieldReturn<TValue> {
  const { form } = useFormContext();
  const unregisterRef = useRef<(() => void) | null>(null);

  // Register field on mount
  useEffect(() => {
    if (!unregisterRef.current) {
      unregisterRef.current = form.registerField(name, {
        validateOn: config.validateOnBlur ? 'blur' : 'change',
      });
    }

    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
        unregisterRef.current = null;
      }
    };
  }, [form, name, config.validateOnBlur, config.validateOnChange]);

  // Subscribe to field state
  const fieldState = useFormSubscription(
    form,
    useCallback(
      (state) =>
        state.fields[name] || {
          touched: false,
          dirty: false,
          validating: false,
          disabled: false,
          visible: true,
        },
      [name],
    ),
  );

  // Subscribe to field value
  const value = useFormSubscription(
    form,
    useCallback(
      (state) => {
        const fieldValue = form.getFieldValue(name);
        return config.format ? config.format(fieldValue) : fieldValue;
      },
      [form, name, config.format],
    ),
  ) as TValue;

  // Subscribe to field error
  const error = useFormSubscription(
    form,
    useCallback((state) => state.fieldErrors[name] || null, [name]),
  );

  // Handlers
  const onChange = useCallback(
    (newValue: TValue) => {
      let processedValue = newValue;

      // Apply transform if provided
      if (config.transform) {
        processedValue = config.transform(newValue) as TValue;
      }

      // Apply parse if provided (for string inputs)
      if (config.parse && typeof newValue === 'string') {
        processedValue = config.parse(newValue) as TValue;
      }

      form.setFieldValue(name, processedValue);

      // Validate on change if enabled
      if (config.validateOnChange) {
        form.validateField(name);
      }
    },
    [form, name, config.transform, config.parse, config.validateOnChange],
  );

  const onBlur = useCallback(() => {
    form.setFieldTouched(name, true);

    // Validate on blur if enabled
    if (config.validateOnBlur !== false) {
      form.validateField(name);
    }
  }, [form, name, config.validateOnBlur]);

  const onFocus = useCallback(() => {
    // Clear field error on focus if desired
    // form.setFieldError(name, null);
  }, []);

  const setValue = useCallback(
    (newValue: TValue) => {
      onChange(newValue);
    },
    [onChange],
  );

  const setTouched = useCallback(
    (touched = true) => {
      form.setFieldTouched(name, touched);
    },
    [form, name],
  );

  const setError = useCallback(
    (errorMessage: string | null) => {
      form.setFieldError(name, errorMessage);
    },
    [form, name],
  );

  const validate = useCallback(() => {
    return form.validateField(name);
  }, [form, name]);

  // Field render props for easier form integration
  const field = useMemo<FieldRenderProps<TValue>>(
    () => ({
      name,
      value,
      onChange: (eventOrValue: React.ChangeEvent<HTMLInputElement> | TValue) => {
        if (typeof eventOrValue === 'object' && eventOrValue !== null && 'target' in eventOrValue) {
          // Handle React change event
          const target = eventOrValue.target as HTMLInputElement;
          let newValue: unknown = target.value;

          // Handle different input types
          if (target.type === 'checkbox') {
            newValue = target.checked;
          } else if (target.type === 'number') {
            newValue = target.valueAsNumber;
          } else if (target.type === 'file') {
            newValue = target.files;
          }

          onChange(newValue as TValue);
        } else {
          // Handle direct value
          onChange(eventOrValue);
        }
      },
      onBlur,
      onFocus,
      disabled: fieldState.disabled,
    }),
    [name, value, onChange, onBlur, onFocus, fieldState.disabled],
  );

  const meta = useMemo(
    () => ({
      touched: fieldState.touched,
      dirty: fieldState.dirty,
      error,
      validating: fieldState.validating,
      disabled: fieldState.disabled,
    }),
    [fieldState, error],
  );

  return {
    value,
    error,
    touched: fieldState.touched,
    dirty: fieldState.dirty,
    validating: fieldState.validating,
    disabled: fieldState.disabled,
    onChange,
    onBlur,
    onFocus,
    setValue,
    setTouched,
    setError,
    validate,
    field,
    meta,
  };
}
