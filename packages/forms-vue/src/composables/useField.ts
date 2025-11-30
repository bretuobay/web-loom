import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';
import { useFormContext } from '../components/FormProvider';
import { useFormSubscription } from './useFormSubscription';
import type { UseFieldConfig, UseFieldReturn, FieldBindings } from '../types';

/**
 * Vue composable for individual field management
 */
export function useField<TValue = unknown>(name: string, config: UseFieldConfig = {}): UseFieldReturn<TValue> {
  const { form } = useFormContext();
  let unregisterField: (() => void) | null = null;

  // Register field on mount
  onMounted(() => {
    const validateOn = config.validateOnChange ? 'change' : config.validateOnBlur === false ? 'submit' : 'blur';

    unregisterField = form.registerField(name, {
      validateOn,
      transform: config.transform,
    });
  });

  // Unregister field on unmount
  onUnmounted(() => {
    if (unregisterField) {
      unregisterField();
    }
  });

  // Subscribe to field state
  const fieldState = useFormSubscription(
    form,
    (state) =>
      state.fields[name] || {
        touched: false,
        dirty: false,
        validating: false,
        disabled: false,
        visible: true,
      },
  );

  // Subscribe to field value
  const fieldValue = useFormSubscription(form, (state) => {
    const value = form.getFieldValue(name);
    return config.format ? config.format(value) : value;
  });

  // Subscribe to field error
  const fieldError = useFormSubscription(form, (state) => state.fieldErrors[name] || null);

  // Reactive refs
  const value = ref(fieldValue.value) as Ref<TValue>;
  const error = ref(fieldError.value);
  const touched = ref(fieldState.value.touched);
  const dirty = ref(fieldState.value.dirty);
  const validating = ref(fieldState.value.validating);
  const disabled = ref(fieldState.value.disabled);

  // Update refs when subscriptions change
  // (Vue's reactivity will handle this automatically)

  // Field methods
  const setValue = (newValue: TValue) => {
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
    value.value = processedValue;

    // Validate on change if enabled
    if (config.validateOnChange) {
      form.validateField(name);
    }
  };

  const setTouched = (touchedValue = true) => {
    form.setFieldTouched(name, touchedValue);
    touched.value = touchedValue;
  };

  const setError = (errorMessage: string | null) => {
    form.setFieldError(name, errorMessage);
    error.value = errorMessage;
  };

  const validate = () => {
    return form.validateField(name);
  };

  const handleBlur = () => {
    setTouched(true);

    // Validate on blur if enabled
    if (config.validateOnBlur !== false) {
      validate();
    }
  };

  const handleFocus = () => {
    // Clear field error on focus if desired
    // setError(null);
  };

  // Field bindings for v-model
  const bindings = computed<FieldBindings<TValue>>(() => ({
    modelValue: value.value,
    'onUpdate:modelValue': setValue,
    onBlur: handleBlur,
    onFocus: handleFocus,
    disabled: disabled.value,
  }));

  // Field metadata
  const meta = computed(() => ({
    touched: touched.value,
    dirty: dirty.value,
    error: error.value,
    validating: validating.value,
    disabled: disabled.value,
  }));

  return {
    value,
    error,
    touched,
    dirty,
    validating,
    disabled,
    setValue,
    setTouched,
    setError,
    validate,
    bindings,
    meta,
  };
}
