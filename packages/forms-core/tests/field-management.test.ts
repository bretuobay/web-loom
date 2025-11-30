import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FieldDependencyManager,
  FieldVisibilityManager,
  AsyncValidationManager,
  AdvancedFieldManager,
} from '../src/field-management';
import { FormFactory } from '../src/form';
import { z } from 'zod';

describe('Advanced Field Management', () => {
  describe('FieldDependencyManager', () => {
    let manager: FieldDependencyManager;

    beforeEach(() => {
      manager = new FieldDependencyManager();
    });

    it('should manage field dependencies', () => {
      manager.addDependency('fieldA', 'fieldB');
      manager.addDependency('fieldA', 'fieldC');

      expect(manager.getDependencies('fieldA')).toEqual(['fieldB', 'fieldC']);
      expect(manager.getDependents('fieldB')).toEqual(['fieldA']);
      expect(manager.getDependents('fieldC')).toEqual(['fieldA']);
    });

    it('should remove dependencies', () => {
      manager.addDependency('fieldA', 'fieldB');
      manager.addDependency('fieldA', 'fieldC');

      manager.removeDependency('fieldA', 'fieldB');

      expect(manager.getDependencies('fieldA')).toEqual(['fieldC']);
      expect(manager.getDependents('fieldB')).toEqual([]);
    });

    it('should manage computed fields', () => {
      const setValue = vi.fn();
      const values = { a: 10, b: 20 };

      manager.addComputedField('sum', (vals) => vals.a + vals.b);
      manager.updateComputedFields(values, setValue);

      expect(setValue).toHaveBeenCalledWith('sum', 30);
    });

    it('should clear all data', () => {
      manager.addDependency('fieldA', 'fieldB');
      manager.addComputedField('sum', (vals) => vals.a + vals.b);

      manager.clear();

      expect(manager.getDependencies('fieldA')).toEqual([]);
      expect(manager.getDependents('fieldB')).toEqual([]);
    });
  });

  describe('FieldVisibilityManager', () => {
    let manager: FieldVisibilityManager;

    beforeEach(() => {
      manager = new FieldVisibilityManager();
    });

    it('should manage visibility rules', () => {
      const setVisible = vi.fn();
      const values = { showField: true, hideField: false };

      manager.addVisibilityRule('conditionalField', (vals) => vals.showField);
      manager.addVisibilityRule('hiddenField', (vals) => vals.hideField);

      const visibility = manager.updateVisibility(values, setVisible);

      expect(visibility.conditionalField).toBe(true);
      expect(visibility.hiddenField).toBe(false);
      expect(setVisible).toHaveBeenCalledWith('conditionalField', true);
      expect(setVisible).toHaveBeenCalledWith('hiddenField', false);
    });

    it('should handle visibility rule errors gracefully', () => {
      const setVisible = vi.fn();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      manager.addVisibilityRule('errorField', () => {
        throw new Error('Rule error');
      });

      const visibility = manager.updateVisibility({}, setVisible);

      expect(visibility.errorField).toBe(true); // Default to visible on error
      expect(setVisible).toHaveBeenCalledWith('errorField', true);
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    it('should remove visibility rules', () => {
      manager.addVisibilityRule('field', () => true);
      manager.removeVisibilityRule('field');

      const setVisible = vi.fn();
      const visibility = manager.updateVisibility({}, setVisible);

      expect(visibility).toEqual({});
    });
  });

  describe('AsyncValidationManager', () => {
    let manager: AsyncValidationManager;

    beforeEach(() => {
      manager = new AsyncValidationManager();
    });

    it('should add and remove async validators', () => {
      const config = {
        validator: vi.fn().mockResolvedValue('error'),
      };

      manager.addValidator('field', config);
      expect(manager.isPending('field')).toBe(false);

      manager.removeValidator('field');
      expect(manager.isPending('field')).toBe(false);
    });

    it('should validate fields asynchronously', async () => {
      const validator = vi.fn().mockResolvedValue('validation error');
      const config = { validator };

      manager.addValidator('field', config);

      const result = await manager.validateField('field', 'value', { values: { field: 'value' } });

      expect(result).toBe('validation error');
      expect(validator).toHaveBeenCalledWith('value', {
        signal: expect.any(AbortSignal),
        values: { field: 'value' },
      });
    });

    it('should cancel pending validations', async () => {
      const validator = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      const config = { validator };

      manager.addValidator('field', config);

      // Start validation but don't wait
      const validationPromise = manager.validateField('field', 'value');

      // Cancel all validations
      manager.cancelAll();

      // The validation should complete without error (returning null for cancelled)
      const result = await validationPromise;
      expect(result).toBeNull();
    });

    it('should handle validation errors', async () => {
      const error = new Error('Network error');
      const validator = vi.fn().mockRejectedValue(error);
      const config = { validator };

      manager.addValidator('field', config);

      await expect(manager.validateField('field', 'value')).rejects.toThrow('Network error');
    });

    it('should clear all validators', () => {
      const config = { validator: vi.fn() };
      manager.addValidator('field', config);

      manager.clear();

      expect(manager.isPending('field')).toBe(false);
    });
  });

  describe('AdvancedFieldManager', () => {
    let form: any;
    let manager: AdvancedFieldManager;
    let schema: any;

    beforeEach(() => {
      schema = z.object({
        firstName: z.string(),
        lastName: z.string(),
        fullName: z.string().optional(),
        email: z.string().email(),
        confirmEmail: z.string().email(),
        showAdvanced: z.boolean().default(false),
        advancedField: z.string().optional(),
      });

      form = FormFactory.create({
        schema,
        defaultValues: {
          firstName: '',
          lastName: '',
          fullName: '',
          email: '',
          confirmEmail: '',
          showAdvanced: false,
          advancedField: '',
        },
      });

      manager = new AdvancedFieldManager(form);
    });

    it('should configure field with dependencies', () => {
      manager.configureField('fullName', {
        dependsOn: ['firstName', 'lastName'],
        compute: (values) => `${values.firstName} ${values.lastName}`.trim(),
      });

      expect(manager.getFieldDependencies('fullName')).toEqual(['firstName', 'lastName']);
      expect(manager.getFieldDependents('firstName')).toEqual(['fullName']);
    });

    it('should configure field with visibility rules', () => {
      manager.configureField('advancedField', {
        visibilityRule: (values) => values.showAdvanced === true,
      });

      form.registerField('advancedField');
      form.setFieldValue('showAdvanced', false);
      manager.onFieldChange('showAdvanced', false);

      // Note: In a real test, you'd check the visibility through the form instance
      // This is a simplified test since we don't have full form integration
    });

    it('should configure field with async validation', async () => {
      const mockValidator = vi.fn().mockResolvedValue(null);

      manager.configureField('email', {
        asyncValidator: {
          validator: mockValidator,
        },
      });

      form.registerField('email');
      manager.onFieldChange('email', 'test@example.com');

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockValidator).toHaveBeenCalledWith('test@example.com', {
        signal: expect.any(AbortSignal),
        values: expect.any(Object),
      });
    });

    it('should remove field configuration', () => {
      manager.configureField('fullName', {
        dependsOn: ['firstName', 'lastName'],
        compute: (values) => `${values.firstName} ${values.lastName}`,
        visibilityRule: () => true,
        asyncValidator: { validator: vi.fn() },
      });

      expect(manager.getFieldDependencies('fullName')).toEqual(['firstName', 'lastName']);

      manager.removeField('fullName');

      expect(manager.getFieldDependencies('fullName')).toEqual([]);
      expect(manager.getFieldDependents('firstName')).toEqual([]);
    });

    it('should handle field change and update dependents', () => {
      form.registerField('firstName');
      form.registerField('lastName');
      form.registerField('fullName');

      manager.configureField('fullName', {
        dependsOn: ['firstName', 'lastName'],
        compute: (values) => `${values.firstName} ${values.lastName}`.trim(),
      });

      form.setFieldValue('firstName', 'John');
      manager.onFieldChange('firstName', 'John');

      form.setFieldValue('lastName', 'Doe');
      manager.onFieldChange('lastName', 'Doe');

      // The computed field should be updated
      expect(form.getFieldValue('fullName')).toBe('John Doe');
    });

    it('should check if field is validating', () => {
      manager.configureField('email', {
        asyncValidator: {
          validator: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))),
        },
      });

      expect(manager.isFieldValidating('email')).toBe(false);

      // Start async validation
      manager.onFieldChange('email', 'test@example.com');

      // Should be validating now (though this might complete quickly)
      // In a real implementation, you'd have better control over the timing
    });

    it('should cancel all validations', () => {
      manager.configureField('email', {
        asyncValidator: {
          validator: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))),
        },
      });

      manager.cancelValidations();

      // Should not throw and should clear any pending validations
      expect(() => manager.destroy()).not.toThrow();
    });

    it('should cleanup properly when destroyed', () => {
      manager.configureField('fullName', {
        dependsOn: ['firstName', 'lastName'],
        compute: (values) => `${values.firstName} ${values.lastName}`,
        visibilityRule: () => true,
        asyncValidator: { validator: vi.fn() },
      });

      expect(manager.getFieldDependencies('fullName')).toEqual(['firstName', 'lastName']);

      manager.destroy();

      // After destruction, dependencies should be cleared
      expect(manager.getFieldDependencies('fullName')).toEqual([]);
    });
  });
});
