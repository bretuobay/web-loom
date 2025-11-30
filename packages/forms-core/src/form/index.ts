/**
 * Form Factory - Core form creation and management
 */

import type { ZodSchema } from 'zod';
import type {
  FormConfig,
  FormInstance,
  FormState,
  FieldMeta,
  FieldState,
  FieldConfig,
  FormEventMap,
  FormErrors,
} from '../types';
import { EventEmitter } from '../utils/events';
import { getPath, setPath, deletePath, hasPath } from '../utils/path';
import { validateWithZod, validateField } from '../validation';

/**
 * Form Factory implementation
 */
export class FormFactory {
  /**
   * Create a new form instance
   */
  static create<TSchema extends ZodSchema>(config: FormConfig<TSchema, any>): FormInstance<TSchema['_input']> {
    return new FormInstanceImpl(config);
  }
}

/**
 * Internal form instance implementation
 */
class FormInstanceImpl<T extends Record<string, unknown> = Record<string, unknown>> implements FormInstance<T> {
  private eventEmitter = new EventEmitter<FormEventMap<T>>();
  private state: FormState<T>;
  private registeredFields = new Set<string>();
  private fieldValidators = new Map<string, (value: unknown) => Promise<string | null>>();
  private validationTimeouts = new Map<string, NodeJS.Timeout>();
  private destroyed = false;

  constructor(private config: FormConfig<any, T>) {
    // Initialize form state
    this.state = {
      values: { ...config.defaultValues } as T,
      defaultValues: { ...config.defaultValues } as T,
      fields: {},
      fieldErrors: {},
      formErrors: [],
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      isDirty: false,
      submitCount: 0,
    };

    // Initial validity is assumed until validation runs
    this.updateValidState();
  }

  // =============================================================================
  // Field Management
  // =============================================================================

  registerField(path: string, fieldConfig?: FieldConfig): () => void {
    if (this.destroyed) {
      throw new Error('Form instance has been destroyed');
    }

    this.registeredFields.add(path);

    // Initialize field metadata
    this.state.fields[path] = {
      touched: false,
      dirty: false,
      validating: false,
      disabled: fieldConfig?.disabled || false,
      visible: !fieldConfig?.hidden,
      registered: true,
      focused: false,
      blurred: false,
      hasError: false,
      lastValidated: null,
      validationCount: 0,
      dependsOn: [],
      dependents: [],
      config: fieldConfig,
    } as FieldMeta;

    // Set initial value if path doesn't exist
    if (!hasPath(this.state.values, path)) {
      setPath(this.state.values as Record<string, unknown>, path, undefined);
    }

    // Emit state change
    this.emitStateChange();

    // Return unregister function
    return () => this.unregisterField(path);
  }

  unregisterField(path: string): void {
    if (this.destroyed) return;

    this.registeredFields.delete(path);
    delete this.state.fields[path];
    delete this.state.fieldErrors[path];
    this.fieldValidators.delete(path);

    // Clear any pending validation
    const timeout = this.validationTimeouts.get(path);
    if (timeout) {
      clearTimeout(timeout);
      this.validationTimeouts.delete(path);
    }

    // Remove value from form data
    deletePath(this.state.values as Record<string, unknown>, path);

    this.emitStateChange();
  }

  getFieldState(path: string): FieldState | null {
    const fieldMeta = this.state.fields[path];
    if (!fieldMeta) return null;

    return {
      value: this.getFieldValue(path),
      error: this.state.fieldErrors[path] || null,
      touched: fieldMeta.touched,
      dirty: fieldMeta.dirty,
      validating: fieldMeta.validating,
      disabled: fieldMeta.disabled,
      visible: fieldMeta.visible,
      focused: fieldMeta.focused,
      hasError: fieldMeta.hasError,
    };
  }

  setFieldValue(path: string, value: unknown): boolean {
    if (this.destroyed || !this.registeredFields.has(path)) {
      return false;
    }

    const fieldMeta = this.state.fields[path];
    if (!fieldMeta || fieldMeta.disabled) {
      return false;
    }

    // Apply transform if configured
    const transformedValue = fieldMeta.config?.transform ? fieldMeta.config.transform(value) : value;

    // Set the value
    setPath(this.state.values as Record<string, unknown>, path, transformedValue);

    // Update field metadata
    fieldMeta.dirty = true;
    fieldMeta.hasError = Boolean(this.state.fieldErrors[path]);

    // Update form dirty state
    this.updateDirtyState();

    // Emit field change event
    const fieldState = this.getFieldState(path)!;
    this.eventEmitter.emit('fieldChange', { path, value: transformedValue, fieldState });

    // Trigger validation if configured
    if (this.config.validateOnChange || fieldMeta.config?.validateOn === 'change') {
      this.validateFieldAsync(path);
    }

    this.emitStateChange();
    return true;
  }

  getFieldValue(path: string): unknown {
    return getPath(this.state.values, path);
  }

  hasField(path: string): boolean {
    return this.registeredFields.has(path);
  }

  // =============================================================================
  // Field Metadata
  // =============================================================================

  setFieldTouched(path: string, touched = true): void {
    const fieldMeta = this.state.fields[path];
    if (!fieldMeta) return;

    fieldMeta.touched = touched;

    if (touched) {
      this.eventEmitter.emit('fieldTouch', { path, fieldState: this.getFieldState(path)! });

      // Trigger validation if configured
      if (this.config.validateOnBlur || fieldMeta.config?.validateOn === 'blur') {
        this.validateFieldAsync(path);
      }
    }

    this.emitStateChange();
  }

  setFieldError(path: string, error: string | null): void {
    if (error) {
      this.state.fieldErrors[path] = error;
    } else {
      delete this.state.fieldErrors[path];
    }

    const fieldMeta = this.state.fields[path];
    if (fieldMeta) {
      fieldMeta.hasError = Boolean(error);
    }

    this.updateValidState();
    this.emitStateChange();
  }

  clearFieldError(path: string): void {
    this.setFieldError(path, null);
  }

  setFieldDisabled(path: string, disabled: boolean): void {
    const fieldMeta = this.state.fields[path];
    if (!fieldMeta) return;

    fieldMeta.disabled = disabled;
    this.emitStateChange();
  }

  setFieldVisible(path: string, visible: boolean): void {
    const fieldMeta = this.state.fields[path];
    if (!fieldMeta) return;

    fieldMeta.visible = visible;
    this.emitStateChange();
  }

  // =============================================================================
  // Form State
  // =============================================================================

  getState(): FormState<T> {
    return { ...this.state };
  }

  getValues(): T {
    return { ...this.state.values };
  }

  setValues(values: Partial<T>): void {
    if (this.destroyed) return;

    // Merge values
    Object.assign(this.state.values, values);

    // Update dirty state for affected fields
    for (const path of Object.keys(values)) {
      const fieldMeta = this.state.fields[path];
      if (fieldMeta) {
        fieldMeta.dirty = true;
      }
    }

    this.updateDirtyState();
    this.emitStateChange();

    // Validate if configured
    if (this.config.validateOnChange) {
      this.validateFormAsync();
    }
  }

  isDirty(): boolean {
    return this.state.isDirty;
  }

  isValid(): boolean {
    return this.state.isValid;
  }

  isSubmitting(): boolean {
    return this.state.isSubmitting;
  }

  // =============================================================================
  // Form Operations
  // =============================================================================

  reset(values?: Partial<T>): void {
    if (this.destroyed) return;

    const resetValues = values ? { ...this.state.defaultValues, ...values } : this.state.defaultValues;

    // Reset state
    this.state.values = { ...resetValues } as T;
    this.state.fieldErrors = {};
    this.state.formErrors = [];
    this.state.isDirty = false;
    this.state.isValid = true;

    // Reset all field metadata
    for (const fieldMeta of Object.values(this.state.fields)) {
      fieldMeta.touched = false;
      fieldMeta.dirty = false;
      fieldMeta.validating = false;
      fieldMeta.focused = false;
      fieldMeta.blurred = false;
      fieldMeta.hasError = false;
      fieldMeta.lastValidated = null;
      fieldMeta.validationCount = 0;
    }

    // Emit reset events
    for (const path of this.registeredFields) {
      const fieldState = this.getFieldState(path)!;
      this.eventEmitter.emit('fieldReset', { path, fieldState });
    }

    this.emitStateChange();
  }

  clear(): void {
    if (this.destroyed) return;

    this.state.values = {} as T;
    this.state.fieldErrors = {};
    this.state.formErrors = [];
    this.state.isDirty = false;
    this.state.isValid = true;

    for (const fieldMeta of Object.values(this.state.fields)) {
      fieldMeta.touched = false;
      fieldMeta.dirty = false;
      fieldMeta.validating = false;
      fieldMeta.focused = false;
      fieldMeta.blurred = false;
      fieldMeta.hasError = false;
      fieldMeta.lastValidated = null;
      fieldMeta.validationCount = 0;
    }

    this.emitStateChange();
  }

  async submit(): Promise<void> {
    if (this.destroyed || this.state.isSubmitting) {
      return;
    }

    this.state.isSubmitting = true;
    this.state.submitCount++;
    this.emitStateChange();

    try {
      // Validate form
      const isValid = await this.validate();

      // Mark all fields as touched
      for (const path of this.registeredFields) {
        this.setFieldTouched(path, true);
      }

      if (isValid && this.config.onSubmit) {
        await this.config.onSubmit(this.state.values);
        this.eventEmitter.emit('submit', { values: this.state.values, success: true });
      } else {
        this.eventEmitter.emit('submit', { values: this.state.values, success: false });
      }
    } catch (error) {
      this.eventEmitter.emit('error', { error: error as Error });
      this.eventEmitter.emit('submit', { values: this.state.values, success: false });
    } finally {
      this.state.isSubmitting = false;
      this.emitStateChange();
    }
  }

  // =============================================================================
  // Validation
  // =============================================================================

  async validate(): Promise<boolean> {
    if (this.destroyed) return false;

    this.state.isValidating = true;
    this.eventEmitter.emit('validationStart', {});
    this.emitStateChange();

    try {
      const result = validateWithZod(this.config.schema, this.state.values);

      // Update errors
      this.state.fieldErrors = { ...result.errors.fieldErrors };
      this.state.formErrors = [...result.errors.formErrors];

      // Update field error states
      for (const path of this.registeredFields) {
        const fieldMeta = this.state.fields[path];
        if (fieldMeta) {
          fieldMeta.hasError = Boolean(this.state.fieldErrors[path]);
        }
      }

      this.updateValidState();

      this.eventEmitter.emit('validationEnd', { success: result.success });
      return result.success;
    } finally {
      this.state.isValidating = false;
      this.emitStateChange();
    }
  }

  async validateField(path: string): Promise<boolean> {
    if (this.destroyed || !this.registeredFields.has(path)) {
      return false;
    }

    const fieldMeta = this.state.fields[path];
    if (!fieldMeta) return false;

    fieldMeta.validating = true;
    fieldMeta.validationCount++;
    this.eventEmitter.emit('validationStart', { path });
    this.emitStateChange();

    try {
      const value = this.getFieldValue(path);
      const error = validateField(this.config.schema, path, value, this.state.values);

      this.setFieldError(path, error);
      fieldMeta.lastValidated = Date.now();

      const success = !error;
      this.eventEmitter.emit('validationEnd', { path, success });
      return success;
    } finally {
      fieldMeta.validating = false;
      this.emitStateChange();
    }
  }

  clearErrors(): void {
    this.state.fieldErrors = {};
    this.state.formErrors = [];

    // Update field error states
    for (const fieldMeta of Object.values(this.state.fields)) {
      fieldMeta.hasError = false;
    }

    this.updateValidState();
    this.emitStateChange();
  }

  setErrors(errors: { fieldErrors?: Record<string, string>; formErrors?: string[] }): void {
    if (errors.fieldErrors) {
      Object.assign(this.state.fieldErrors, errors.fieldErrors);
    }

    if (errors.formErrors) {
      this.state.formErrors.push(...errors.formErrors);
    }

    // Update field error states
    for (const path of Object.keys(errors.fieldErrors || {})) {
      const fieldMeta = this.state.fields[path];
      if (fieldMeta) {
        fieldMeta.hasError = true;
      }
    }

    this.updateValidState();
    this.emitStateChange();
  }

  // =============================================================================
  // Subscriptions
  // =============================================================================

  subscribe<K extends keyof FormEventMap<T>>(event: K, callback: (...args: FormEventMap<T>[K]) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  subscribeToField(path: string, callback: (fieldState: FieldState) => void): () => void {
    return this.eventEmitter.on('fieldChange', ({ path: changedPath, fieldState }) => {
      if (changedPath === path) {
        callback(fieldState);
      }
    });
  }

  subscribeToErrors(callback: (errors: FormErrors) => void): () => void {
    return this.eventEmitter.on('stateChange', (state) => {
      callback({
        fieldErrors: state.fieldErrors,
        formErrors: state.formErrors,
      });
    });
  }

  // =============================================================================
  // Utilities
  // =============================================================================

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;

    // Clear all timeouts
    for (const timeout of this.validationTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.validationTimeouts.clear();

    // Cleanup event emitter
    this.eventEmitter.destroy();

    // Clear references
    this.registeredFields.clear();
    this.fieldValidators.clear();
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private emitStateChange(): void {
    this.eventEmitter.emit('stateChange', this.getState());
  }

  private updateDirtyState(): void {
    // Check if any field is dirty
    this.state.isDirty = Object.values(this.state.fields).some((field) => field.dirty);
  }

  private updateValidState(): void {
    // Form is valid if there are no field errors or form errors
    this.state.isValid = Object.keys(this.state.fieldErrors).length === 0 && this.state.formErrors.length === 0;
  }

  private async validateFormAsync(): Promise<void> {
    try {
      await this.validate();
    } catch (error) {
      this.eventEmitter.emit('error', { error: error as Error });
    }
  }

  private async validateFieldAsync(path: string): Promise<void> {
    const fieldMeta = this.state.fields[path];
    if (!fieldMeta || !fieldMeta.config) {
      return;
    }

    // Handle debounced validation
    const debounceMs = fieldMeta.config.debounceValidation || 0;
    if (debounceMs > 0) {
      // Clear existing timeout
      const existingTimeout = this.validationTimeouts.get(path);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        this.validateField(path);
        this.validationTimeouts.delete(path);
      }, debounceMs);

      this.validationTimeouts.set(path, timeout);
    } else {
      // Immediate validation
      await this.validateField(path);
    }
  }
}
