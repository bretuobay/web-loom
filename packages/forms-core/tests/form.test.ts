import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { FormFactory } from '../src/form';
import { createZodForm } from '../src/integration/zod';

describe('FormFactory', () => {
  describe('Basic Form Creation', () => {
    it('should create a form with initial values', () => {
      const schema = z.object({
        name: z.string().default(''),
        age: z.number().default(0),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { name: 'John', age: 25 },
      });

      expect(form.getValues()).toEqual({ name: 'John', age: 25 });
      expect(form.isDirty()).toBe(false);
      expect(form.isValid()).toBe(true);
    });

    it('should register and unregister fields', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { email: '' },
      });

      const unregister = form.registerField('email');
      expect(form.hasField('email')).toBe(true);
      expect(form.getFieldState('email')).toMatchObject({
        value: '',
        error: null,
        touched: false,
        dirty: false,
        validating: false,
        disabled: false,
        visible: true,
        focused: false,
        hasError: false,
      });

      unregister();
      expect(form.hasField('email')).toBe(false);
      expect(form.getFieldState('email')).toBeNull();
    });
  });

  describe('Field Value Management', () => {
    it('should set and get field values', () => {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { username: '', password: '' },
      });

      form.registerField('username');
      form.registerField('password');

      expect(form.setFieldValue('username', 'john_doe')).toBe(true);
      expect(form.getFieldValue('username')).toBe('john_doe');
      expect(form.getValues()).toEqual({ username: 'john_doe', password: '' });
      expect(form.isDirty()).toBe(true);
    });

    it('should not allow setting values on unregistered fields', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
      });

      expect(form.setFieldValue('name', 'John')).toBe(false);
      expect(form.getFieldValue('name')).toBe('');
    });

    it('should not allow setting values on disabled fields', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
      });

      form.registerField('name', { disabled: true });
      expect(form.setFieldValue('name', 'John')).toBe(false);
      expect(form.getFieldValue('name')).toBe('');
    });
  });

  describe('Field Metadata Management', () => {
    let form: any;
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    beforeEach(() => {
      form = FormFactory.create({
        schema,
        defaultValues: { email: '', name: '' },
      });
      form.registerField('email');
      form.registerField('name');
    });

    it('should manage field touched state', () => {
      expect(form.getFieldState('email')?.touched).toBe(false);

      form.setFieldTouched('email', true);
      expect(form.getFieldState('email')?.touched).toBe(true);

      form.setFieldTouched('email', false);
      expect(form.getFieldState('email')?.touched).toBe(false);
    });

    it('should manage field disabled state', () => {
      expect(form.getFieldState('email')?.disabled).toBe(false);

      form.setFieldDisabled('email', true);
      expect(form.getFieldState('email')?.disabled).toBe(true);

      form.setFieldDisabled('email', false);
      expect(form.getFieldState('email')?.disabled).toBe(false);
    });

    it('should manage field visibility', () => {
      expect(form.getFieldState('email')?.visible).toBe(true);

      form.setFieldVisible('email', false);
      expect(form.getFieldState('email')?.visible).toBe(false);

      form.setFieldVisible('email', true);
      expect(form.getFieldState('email')?.visible).toBe(true);
    });

    it('should set and clear field errors', () => {
      expect(form.getFieldState('email')?.error).toBeNull();
      expect(form.getFieldState('email')?.hasError).toBe(false);

      form.setFieldError('email', 'Invalid email');
      expect(form.getFieldState('email')?.error).toBe('Invalid email');
      expect(form.getFieldState('email')?.hasError).toBe(true);

      form.clearFieldError('email');
      expect(form.getFieldState('email')?.error).toBeNull();
      expect(form.getFieldState('email')?.hasError).toBe(false);
    });
  });

  describe('Form State Management', () => {
    it('should handle form reset', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: 'Initial' },
      });

      form.registerField('name');
      form.setFieldValue('name', 'Modified');
      form.setFieldTouched('name', true);
      form.setFieldError('name', 'Some error');

      expect(form.isDirty()).toBe(true);
      expect(form.isValid()).toBe(false);

      form.reset();

      expect(form.getValues()).toEqual({ name: 'Initial' });
      expect(form.isDirty()).toBe(false);
      expect(form.isValid()).toBe(true);
      expect(form.getFieldState('name')?.touched).toBe(false);
      expect(form.getFieldState('name')?.error).toBeNull();
    });

    it('should handle form reset with new values', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: 'Initial' },
      });

      form.registerField('name');
      form.setFieldValue('name', 'Modified');

      form.reset({ name: 'New Value' });

      expect(form.getValues()).toEqual({ name: 'New Value' });
      expect(form.isDirty()).toBe(false);
    });

    it('should handle form clear', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: 'Initial' },
      });

      form.registerField('name');
      form.setFieldValue('name', 'Modified');

      form.clear();

      expect(form.getValues()).toEqual({});
      expect(form.isDirty()).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate entire form', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18 or older'),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { email: '', age: 0 },
      });

      form.registerField('email');
      form.registerField('age');

      // Test invalid values
      form.setFieldValue('email', 'invalid-email');
      form.setFieldValue('age', 16);

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.isValid()).toBe(false);

      // Test valid values
      form.setFieldValue('email', 'test@example.com');
      form.setFieldValue('age', 25);

      const isValid2 = await form.validate();
      expect(isValid2).toBe(true);
      expect(form.isValid()).toBe(true);
    });

    it('should validate individual fields', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { email: '' },
      });

      form.registerField('email');
      form.setFieldValue('email', 'invalid-email');

      const isValid = await form.validateField('email');
      expect(isValid).toBe(false);
      expect(form.getFieldState('email')?.error).toBe('Invalid email');

      form.setFieldValue('email', 'test@example.com');
      const isValid2 = await form.validateField('email');
      expect(isValid2).toBe(true);
      expect(form.getFieldState('email')?.error).toBeNull();
    });

    it('should clear all errors', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
      });

      form.registerField('name');
      form.setFieldError('name', 'Some error');
      form.setErrors({ formErrors: ['Form error'] });

      expect(form.isValid()).toBe(false);

      form.clearErrors();

      expect(form.isValid()).toBe(true);
      expect(form.getFieldState('name')?.error).toBeNull();
      const state = form.getState();
      expect(state.formErrors).toEqual([]);
    });
  });

  describe('Form Submission', () => {
    it('should handle successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({
        name: z.string().min(1, 'Required'),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
        onSubmit,
      });

      form.registerField('name');
      form.setFieldValue('name', 'John');

      await form.submit();

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
      expect(form.getState().submitCount).toBe(1);
      expect(form.isSubmitting()).toBe(false);
    });

    it('should not submit invalid form', async () => {
      const onSubmit = vi.fn();
      const schema = z.object({
        name: z.string().min(1, 'Required'),
      });

      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
        onSubmit,
      });

      form.registerField('name');
      // Leave name empty (invalid)

      await form.submit();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(form.getState().submitCount).toBe(1);
      expect(form.getFieldState('name')?.touched).toBe(true);
    });

    it('should handle submission errors', async () => {
      const error = new Error('Network error');
      const onSubmit = vi.fn().mockRejectedValue(error);
      const schema = z.object({ name: z.string() });

      const form = FormFactory.create({
        schema,
        defaultValues: { name: 'John' },
        onSubmit,
      });

      form.registerField('name');

      let errorEmitted = false;
      form.subscribe('error', (event) => {
        expect(event.error).toBe(error);
        errorEmitted = true;
      });

      await form.submit();

      expect(errorEmitted).toBe(true);
      expect(form.isSubmitting()).toBe(false);
    });
  });

  describe('Event Subscriptions', () => {
    it('should emit state change events', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
      });

      const stateChanges: any[] = [];
      const unsubscribe = form.subscribe('stateChange', (state) => {
        stateChanges.push(state);
      });

      form.registerField('name');
      form.setFieldValue('name', 'John');

      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges[stateChanges.length - 1].values.name).toBe('John');

      unsubscribe();
    });

    it('should emit field change events', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
      });

      const fieldChanges: any[] = [];
      const unsubscribe = form.subscribe('fieldChange', (event) => {
        fieldChanges.push(event);
      });

      form.registerField('name');
      form.setFieldValue('name', 'John');

      expect(fieldChanges.length).toBe(1);
      expect(fieldChanges[0].path).toBe('name');
      expect(fieldChanges[0].value).toBe('John');

      unsubscribe();
    });

    it('should subscribe to specific field changes', () => {
      const schema = z.object({ name: z.string(), email: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '', email: '' },
      });

      const nameChanges: any[] = [];
      const unsubscribe = form.subscribeToField('name', (fieldState) => {
        nameChanges.push(fieldState);
      });

      form.registerField('name');
      form.registerField('email');

      form.setFieldValue('name', 'John');
      form.setFieldValue('email', 'john@example.com');

      // Should only receive changes for the 'name' field
      expect(nameChanges.length).toBe(1);
      expect(nameChanges[0].value).toBe('John');

      unsubscribe();
    });
  });

  describe('Form Destruction', () => {
    it('should properly cleanup when destroyed', () => {
      const schema = z.object({ name: z.string() });
      const form = FormFactory.create({
        schema,
        defaultValues: { name: '' },
      });

      form.registerField('name');
      expect(() => form.getValues()).not.toThrow();

      form.destroy();

      // Operations after destruction should throw
      expect(() => form.registerField('email')).toThrow('Form instance has been destroyed');
    });
  });
});

describe('Zod Integration', () => {
  describe('ZodFormBuilder', () => {
    it('should extract default values from schema', () => {
      const schema = z.object({
        name: z.string().default('John'),
        age: z.number().default(25),
        email: z.string().optional(),
      });

      const zodForm = createZodForm(schema);
      const form = zodForm.build();
      const defaults = form.getDefaultValues();

      expect(defaults).toMatchObject({
        name: 'John',
        age: 25,
      });
    });

    it('should validate field paths', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(2, 'Too short'),
          email: z.string().email('Invalid email'),
        }),
      });

      const zodForm = createZodForm(schema);
      const form = zodForm.build();

      const nameError = form.validatePath('user.name', 'x');
      expect(nameError).toBe('Too short');

      const emailError = form.validatePath('user.email', 'invalid');
      expect(emailError).toBe('Invalid email');

      const validName = form.validatePath('user.name', 'John');
      expect(validName).toBeNull();
    });

    it('should transform values using schema', () => {
      const schema = z.object({
        name: z.string().transform((s) => s.toUpperCase()),
        age: z.string().transform((s) => parseInt(s)),
      });

      const zodForm = createZodForm(schema);
      const form = zodForm.build();

      const transformed = form.transformValues({
        name: 'john',
        age: '25',
      });

      expect(transformed).toEqual({
        name: 'JOHN',
        age: 25,
      });
    });
  });

  describe('Field Schema Extraction', () => {
    it('should extract field information from schema', () => {
      const schema = z.object({
        requiredField: z.string(),
        optionalField: z.string().optional(),
        defaultField: z.string().default('default'),
      });

      const zodForm = createZodForm(schema);
      const form = zodForm.build();

      const requiredField = form.createField('requiredField');
      const requiredInfo = requiredField.getFieldInfo();
      expect(requiredInfo.isRequired).toBe(true);
      expect(requiredInfo.isOptional).toBe(false);
      expect(requiredInfo.hasDefault).toBe(false);

      const optionalField = form.createField('optionalField');
      const optionalInfo = optionalField.getFieldInfo();
      expect(optionalInfo.isRequired).toBe(false);
      expect(optionalInfo.isOptional).toBe(true);

      const defaultField = form.createField('defaultField');
      const defaultInfo = defaultField.getFieldInfo();
      expect(defaultInfo.hasDefault).toBe(true);
      expect(defaultInfo.defaultValue).toBe('default');
    });

    it('should validate individual field values', () => {
      const schema = z.object({
        email: z.string().email('Invalid email format'),
      });

      const zodForm = createZodForm(schema);
      const form = zodForm.build();
      const emailField = form.createField('email');

      const invalidResult = emailField.validateValue('invalid-email');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toBe('Invalid email format');

      const validResult = emailField.validateValue('test@example.com');
      expect(validResult.success).toBe(true);
      expect(validResult.error).toBeUndefined();
    });
  });
});
