import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createFormBehavior } from '../form';

/**
 * Property-Based Tests for Form Behavior Enhancement
 * Feature: ui-core-gaps, Property 32 & 33: Manual error setting and error merging
 * Validates: Requirements 9.2, 9.4
 */

describe('Form Behavior Property-Based Tests', () => {
  /**
   * Feature: ui-core-gaps, Property 32: Manual error setting
   * Validates: Requirements 9.2
   *
   * Property: For any field, when setFieldError is called, the field error should be set
   * without triggering validation.
   */
  it('Property 32: Manual error setting', () => {
    fc.assert(
      fc.property(
        // Generate field names (excluding protected property names)
        fc.array(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => !['__proto__', 'constructor', 'prototype'].includes(s)),
          { minLength: 1, maxLength: 5 },
        ),
        // Generate error messages
        fc.string({ minLength: 1, maxLength: 100 }),
        (fieldNames, errorMessage) => {
          // Create initial values object
          const initialValues: Record<string, string> = {};
          fieldNames.forEach((field) => {
            initialValues[field] = '';
          });

          // Track validation calls
          let validationCalls = 0;
          const fields: Record<string, any> = {};
          fieldNames.forEach((field) => {
            fields[field] = {
              validate: () => {
                validationCalls++;
                return null;
              },
            };
          });

          const form = createFormBehavior({
            initialValues,
            fields,
          });

          // Pick a random field to set error on
          const targetField = fieldNames[0];

          // Set manual error
          form.actions.setFieldError(targetField, errorMessage);

          // Verify error was set
          const state = form.getState();
          expect(state.errors[targetField]).toBe(errorMessage);
          expect(state.manualErrors[targetField]).toBe(errorMessage);

          // Verify validation was NOT triggered
          expect(validationCalls).toBe(0);

          // Verify isValid flag is false
          expect(state.isValid).toBe(false);

          form.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: ui-core-gaps, Property 33: Error merging
   * Validates: Requirements 9.4
   *
   * Property: For any field with both manual and validation errors, both errors should be
   * present in the field's error state, with manual errors taking precedence.
   */
  it('Property 33: Error merging', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different error messages using tuple
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          )
          .filter(([a, b]) => a !== b),
        async ([validationError, manualError]) => {
          // Use fixed unique field names to avoid collisions
          const validationField = 'field1';
          const manualField = 'field2';

          const form = createFormBehavior({
            initialValues: {
              [validationField]: '',
              [manualField]: '',
            },
            fields: {
              [validationField]: {
                validate: (value: string) => {
                  // Return validation error for empty values
                  return value ? null : validationError;
                },
              },
              [manualField]: {
                validate: (value: string) => {
                  return null; // No validation error for this field
                },
              },
            },
          });

          // Trigger validation on first field (should fail because value is empty)
          await form.actions.validateField(validationField);

          // Set manual error on second field
          form.actions.setFieldError(manualField, manualError);

          // Verify both errors are present
          const state = form.getState();
          expect(state.errors[validationField]).toBe(validationError);
          expect(state.errors[manualField]).toBe(manualError);

          // Verify manual error is tracked separately
          expect(state.manualErrors[manualField]).toBe(manualError);
          expect(state.manualErrors[validationField]).toBeUndefined();

          // Verify form is invalid
          expect(state.isValid).toBe(false);

          form.destroy();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 33a: Manual errors take precedence over validation errors
   *
   * Property: For any field, when both manual and validation errors exist,
   * the manual error should be displayed.
   */
  it('Property 33a: Manual errors take precedence', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different error messages using tuple
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          )
          .filter(([a, b]) => a !== b),
        async ([validationError, manualError]) => {
          const fieldName = 'testField';
          const form = createFormBehavior({
            initialValues: { [fieldName]: '' },
            fields: {
              [fieldName]: {
                validate: (value: string) => {
                  return value ? null : validationError;
                },
              },
            },
          });

          // Trigger validation (should fail)
          await form.actions.validateField(fieldName);
          expect(form.getState().errors[fieldName]).toBe(validationError);

          // Set manual error (should override)
          form.actions.setFieldError(fieldName, manualError);
          expect(form.getState().errors[fieldName]).toBe(manualError);

          // Clear manual error (validation error should show again)
          form.actions.setFieldError(fieldName, null);
          expect(form.getState().errors[fieldName]).toBe(validationError);

          form.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 33b: Clearing manual errors reveals validation errors
   *
   * Property: For any field with both manual and validation errors,
   * clearing the manual error should reveal the validation error.
   */
  it('Property 33b: Clearing manual errors reveals validation errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different error messages using tuple
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          )
          .filter(([a, b]) => a !== b),
        async ([validationError, manualError]) => {
          const fieldName = 'testField';
          const form = createFormBehavior({
            initialValues: { [fieldName]: '' },
            fields: {
              [fieldName]: {
                validate: () => validationError,
              },
            },
          });

          // Trigger validation
          await form.actions.validateField(fieldName);
          const stateAfterValidation = form.getState();
          expect(stateAfterValidation.errors[fieldName]).toBe(validationError);

          // Set manual error
          form.actions.setFieldError(fieldName, manualError);
          const stateAfterManual = form.getState();
          expect(stateAfterManual.errors[fieldName]).toBe(manualError);

          // Clear manual error
          form.actions.setFieldError(fieldName, null);
          const stateAfterClear = form.getState();

          // Validation error should be visible again
          expect(stateAfterClear.errors[fieldName]).toBe(validationError);
          expect(stateAfterClear.manualErrors[fieldName]).toBeUndefined();

          form.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 33c: Form reset clears both manual and validation errors
   *
   * Property: For any form with manual and validation errors,
   * calling resetForm should clear all errors.
   */
  it('Property 33c: Form reset clears all errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        // Generate two different error messages using tuple
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          )
          .filter(([a, b]) => a !== b),
        async (numFields, [validationError, manualError]) => {
          // Create unique field names
          const fieldNames = Array.from({ length: numFields }, (_, i) => `field${i}`);

          // Create initial values
          const initialValues: Record<string, string> = {};
          const fields: Record<string, any> = {};

          fieldNames.forEach((field) => {
            initialValues[field] = '';
            fields[field] = {
              validate: () => validationError,
            };
          });

          const form = createFormBehavior({
            initialValues,
            fields,
          });

          // Add validation errors to all fields
          await form.actions.validateForm();

          // Add manual errors to all fields
          fieldNames.forEach((field) => {
            form.actions.setFieldError(field, manualError);
          });

          // Verify errors exist
          const stateBeforeReset = form.getState();
          fieldNames.forEach((field) => {
            expect(stateBeforeReset.errors[field]).toBe(manualError);
          });
          expect(stateBeforeReset.isValid).toBe(false);

          // Reset form
          form.actions.resetForm();

          // Verify all errors are cleared
          const stateAfterReset = form.getState();
          expect(stateAfterReset.errors).toEqual({});
          expect(stateAfterReset.manualErrors).toEqual({});
          expect(stateAfterReset.isValid).toBe(true);

          form.destroy();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
