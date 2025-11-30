/**
 * Advanced field state management utilities for forms-core
 */

import type { FieldConfig, FormInstance, AsyncValidatorConfig } from '../types';
import { AsyncValidator } from '../validation';

/**
 * Field dependency manager for conditional logic
 */
export class FieldDependencyManager {
  private dependencies = new Map<string, Set<string>>();
  private dependents = new Map<string, Set<string>>();
  private computedFields = new Map<string, (values: Record<string, unknown>) => unknown>();

  /**
   * Add dependency relationship between fields
   */
  addDependency(field: string, dependsOn: string): void {
    if (!this.dependencies.has(field)) {
      this.dependencies.set(field, new Set());
    }

    if (!this.dependents.has(dependsOn)) {
      this.dependents.set(dependsOn, new Set());
    }

    this.dependencies.get(field)!.add(dependsOn);
    this.dependents.get(dependsOn)!.add(field);
  }

  /**
   * Remove dependency relationship
   */
  removeDependency(field: string, dependsOn: string): void {
    this.dependencies.get(field)?.delete(dependsOn);
    this.dependents.get(dependsOn)?.delete(field);
  }

  /**
   * Get fields that depend on a given field
   */
  getDependents(field: string): string[] {
    return Array.from(this.dependents.get(field) || []);
  }

  /**
   * Get fields that a given field depends on
   */
  getDependencies(field: string): string[] {
    return Array.from(this.dependencies.get(field) || []);
  }

  /**
   * Add computed field
   */
  addComputedField(field: string, compute: (values: Record<string, unknown>) => unknown): void {
    this.computedFields.set(field, compute);
  }

  /**
   * Remove computed field
   */
  removeComputedField(field: string): void {
    this.computedFields.delete(field);
  }

  /**
   * Update computed fields based on current form values
   */
  updateComputedFields(values: Record<string, unknown>, setValue: (path: string, value: unknown) => void): void {
    for (const [field, compute] of this.computedFields.entries()) {
      try {
        const newValue = compute(values);
        setValue(field, newValue);
      } catch (error) {
        console.warn(`Error computing field ${field}:`, error);
      }
    }
  }

  /**
   * Clear all dependencies and computed fields
   */
  clear(): void {
    this.dependencies.clear();
    this.dependents.clear();
    this.computedFields.clear();
  }
}

/**
 * Field visibility manager for conditional display
 */
export class FieldVisibilityManager {
  private visibilityRules = new Map<string, (values: Record<string, unknown>) => boolean>();

  /**
   * Add visibility rule for a field
   */
  addVisibilityRule(field: string, rule: (values: Record<string, unknown>) => boolean): void {
    this.visibilityRules.set(field, rule);
  }

  /**
   * Remove visibility rule for a field
   */
  removeVisibilityRule(field: string): void {
    this.visibilityRules.delete(field);
  }

  /**
   * Update field visibility based on current form values
   */
  updateVisibility(
    values: Record<string, unknown>,
    setVisible: (path: string, visible: boolean) => void,
  ): Record<string, boolean> {
    const visibilityMap: Record<string, boolean> = {};

    for (const [field, rule] of this.visibilityRules.entries()) {
      try {
        const visible = rule(values);
        visibilityMap[field] = visible;
        setVisible(field, visible);
      } catch (error) {
        console.warn(`Error evaluating visibility rule for ${field}:`, error);
        visibilityMap[field] = true; // Default to visible on error
        setVisible(field, true);
      }
    }

    return visibilityMap;
  }

  /**
   * Clear all visibility rules
   */
  clear(): void {
    this.visibilityRules.clear();
  }
}

/**
 * Async validation manager for complex validation scenarios
 */
export class AsyncValidationManager {
  private validators = new Map<string, AsyncValidator>();
  private pendingValidations = new Map<string, Promise<string | null>>();

  /**
   * Add async validator for a field
   */
  addValidator(field: string, config: AsyncValidatorConfig): void {
    const validator = new AsyncValidator(config);
    this.validators.set(field, validator);
  }

  /**
   * Remove async validator for a field
   */
  removeValidator(field: string): void {
    const validator = this.validators.get(field);
    if (validator) {
      validator.destroy();
      this.validators.delete(field);
    }
    this.pendingValidations.delete(field);
  }

  /**
   * Validate field asynchronously
   */
  async validateField(
    field: string,
    value: unknown,
    context?: { values: Record<string, unknown> },
  ): Promise<string | null> {
    const validator = this.validators.get(field);
    if (!validator) {
      return null;
    }

    // Cancel any pending validation for this field
    const pending = this.pendingValidations.get(field);
    if (pending) {
      validator.cancel();
    }

    // Start new validation
    const validationPromise = validator.validate(value, context);
    this.pendingValidations.set(field, validationPromise);

    try {
      const result = await validationPromise;
      this.pendingValidations.delete(field);
      return result;
    } catch (error) {
      this.pendingValidations.delete(field);
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Validation was cancelled
      }
      throw error;
    }
  }

  /**
   * Cancel all pending validations
   */
  cancelAll(): void {
    for (const validator of this.validators.values()) {
      validator.cancel();
    }
    this.pendingValidations.clear();
  }

  /**
   * Check if field has pending validation
   */
  isPending(field: string): boolean {
    return this.pendingValidations.has(field);
  }

  /**
   * Clear all validators and pending validations
   */
  clear(): void {
    this.cancelAll();
    for (const validator of this.validators.values()) {
      validator.destroy();
    }
    this.validators.clear();
  }
}

/**
 * Advanced field configuration interface
 */
export interface AdvancedFieldConfig extends FieldConfig {
  dependsOn?: string[];
  compute?: (values: Record<string, unknown>) => unknown;
  visibilityRule?: (values: Record<string, unknown>) => boolean;
  asyncValidator?: AsyncValidatorConfig;
}

/**
 * Field state manager that combines all advanced field management features
 */
export class AdvancedFieldManager {
  private dependencies = new FieldDependencyManager();
  private visibility = new FieldVisibilityManager();
  private asyncValidation = new AsyncValidationManager();
  private fieldConfigs = new Map<string, AdvancedFieldConfig>();

  constructor(private formInstance: FormInstance) {}

  /**
   * Configure advanced field options
   */
  configureField(field: string, config: AdvancedFieldConfig): void {
    // Store field config
    this.fieldConfigs.set(field, config);

    // Setup dependencies
    if (config.dependsOn) {
      for (const dependency of config.dependsOn) {
        this.dependencies.addDependency(field, dependency);
      }
    }

    // Setup computed field
    if (config.compute) {
      this.dependencies.addComputedField(field, config.compute);
    }

    // Setup visibility rule
    if (config.visibilityRule) {
      this.visibility.addVisibilityRule(field, config.visibilityRule);
    }

    // Setup async validation
    if (config.asyncValidator) {
      this.asyncValidation.addValidator(field, config.asyncValidator);
    }
  }

  /**
   * Remove field configuration
   */
  removeField(field: string): void {
    const config = this.fieldConfigs.get(field);
    if (config) {
      // Remove dependencies
      if (config.dependsOn) {
        for (const dependency of config.dependsOn) {
          this.dependencies.removeDependency(field, dependency);
        }
      }

      // Remove computed field
      this.dependencies.removeComputedField(field);

      // Remove visibility rule
      this.visibility.removeVisibilityRule(field);

      // Remove async validator
      this.asyncValidation.removeValidator(field);

      this.fieldConfigs.delete(field);
    }
  }

  /**
   * Handle field value change and update dependent fields
   */
  onFieldChange(field: string, value: unknown): void {
    const values = this.formInstance.getValues();

    // Update computed fields that depend on this field
    const dependents = this.dependencies.getDependents(field);
    if (dependents.length > 0) {
      this.dependencies.updateComputedFields(values, (path, computedValue) => {
        this.formInstance.setFieldValue(path, computedValue);
      });
    }

    // Update visibility for all fields
    this.visibility.updateVisibility(values, (path, visible) => {
      this.formInstance.setFieldVisible(path, visible);
    });

    // Trigger async validation for this field if configured
    const config = this.fieldConfigs.get(field);
    if (config?.asyncValidator) {
      this.validateFieldAsync(field, value, { values });
    }
  }

  /**
   * Validate field asynchronously
   */
  private async validateFieldAsync(
    field: string,
    value: unknown,
    context: { values: Record<string, unknown> },
  ): Promise<void> {
    try {
      const error = await this.asyncValidation.validateField(field, value, context);
      this.formInstance.setFieldError(field, error);
    } catch (error) {
      console.error(`Async validation error for field ${field}:`, error);
      this.formInstance.setFieldError(field, error instanceof Error ? error.message : 'Validation error');
    }
  }

  /**
   * Get field dependencies
   */
  getFieldDependencies(field: string): string[] {
    return this.dependencies.getDependencies(field);
  }

  /**
   * Get fields that depend on a given field
   */
  getFieldDependents(field: string): string[] {
    return this.dependencies.getDependents(field);
  }

  /**
   * Check if field is currently pending async validation
   */
  isFieldValidating(field: string): boolean {
    return this.asyncValidation.isPending(field);
  }

  /**
   * Cancel all pending async validations
   */
  cancelValidations(): void {
    this.asyncValidation.cancelAll();
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.dependencies.clear();
    this.visibility.clear();
    this.asyncValidation.clear();
    this.fieldConfigs.clear();
  }
}

/**
 * Field focus manager for tracking field interaction
 */
export class FieldFocusManager {
  private focusedField: string | null = null;
  private focusHistory: string[] = [];
  private blurTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private formInstance: FormInstance) {}

  /**
   * Handle field focus
   */
  onFieldFocus(field: string): void {
    // Cancel any pending blur timeout for this field
    const blurTimeout = this.blurTimeouts.get(field);
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      this.blurTimeouts.delete(field);
    }

    this.focusedField = field;
    this.focusHistory.push(field);

    // Update field metadata
    const fieldState = this.formInstance.getFieldState(field);
    if (fieldState) {
      // Emit focus event through form instance
      // Note: This would require extending the FormInstance interface
      // For now, we'll assume the form instance handles this internally
    }
  }

  /**
   * Handle field blur with debounce
   */
  onFieldBlur(field: string, debounceMs = 100): void {
    // Set a timeout to handle blur
    const timeout = setTimeout(() => {
      if (this.focusedField === field) {
        this.focusedField = null;
      }

      // Mark field as touched
      this.formInstance.setFieldTouched(field, true);

      this.blurTimeouts.delete(field);
    }, debounceMs);

    this.blurTimeouts.set(field, timeout);
  }

  /**
   * Get currently focused field
   */
  getFocusedField(): string | null {
    return this.focusedField;
  }

  /**
   * Get focus history
   */
  getFocusHistory(): string[] {
    return [...this.focusHistory];
  }

  /**
   * Clear focus history
   */
  clearHistory(): void {
    this.focusHistory = [];
  }

  /**
   * Cleanup all timeouts
   */
  destroy(): void {
    for (const timeout of this.blurTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.blurTimeouts.clear();
    this.focusedField = null;
    this.focusHistory = [];
  }
}
