import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormViewModel } from './form-view-model';
import { z, ZodError } from 'zod';

// Advance past the 50ms validation debounce; signals settle synchronously after.
const advanceFormTimers = (timeToAdvance = 50) => {
  vi.advanceTimersByTime(timeToAdvance);
};

describe('FormViewModel', () => {
  const testSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Must be 18 or older').optional(),
  });
  type TestData = z.infer<typeof testSchema>;

  const initialTestData: Partial<TestData> = { name: '', email: '' };
  let viewModel: FormViewModel<TestData, typeof testSchema>;

  beforeEach(() => {
    vi.useFakeTimers();
    viewModel = new FormViewModel<TestData, typeof testSchema>(initialTestData, testSchema);
  });

  afterEach(() => {
    viewModel.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with initial data', () => {
    expect(viewModel.formData$.get()).toEqual(initialTestData);
  });

  it('should correctly reflect initial validation state (invalid)', () => {
    expect(viewModel.isValid$.get()).toBe(false);
  });

  it('should correctly reflect initial validation state (valid with defaults)', () => {
    const validInitialSchema = z.object({
      name: z.string().default('test'),
      email: z.string().email().default('test@test.com'),
    });
    const vm = new FormViewModel<z.infer<typeof validInitialSchema>, typeof validInitialSchema>({}, validInitialSchema);
    expect(vm.isValid$.get()).toBe(true);
    vm.dispose();
  });

  it('should update field data and formData$', () => {
    viewModel.updateField('name', 'Test User');
    expect(viewModel.formData$.get().name).toBe('Test User');
  });

  it('should become valid when data meets schema requirements', () => {
    viewModel.updateField('name', 'Valid Name');
    viewModel.updateField('email', 'valid@email.com');
    advanceFormTimers();
    expect(viewModel.isValid$.get()).toBe(true);
  });

  it('should become invalid when data does not meet schema requirements', () => {
    viewModel.updateField('name', 'Valid Name');
    viewModel.updateField('email', 'valid@email.com');
    advanceFormTimers();
    expect(viewModel.isValid$.get()).toBe(true);

    viewModel.updateField('email', 'invalid-email');
    advanceFormTimers();
    expect(viewModel.isValid$.get()).toBe(false);
  });

  it('should report errors when data is invalid', () => {
    viewModel.updateField('name', 'Te');
    advanceFormTimers();

    const errors = viewModel.errors$.get() as ZodError<TestData>;
    expect(errors).toBeInstanceOf(ZodError);
    expect(errors.issues[0]?.message).toBe('Name must be at least 3 characters');

    const fieldErrors = viewModel.fieldErrors$.get();
    expect(fieldErrors.name).toContain('Name must be at least 3 characters');
  });

  it('should clear errors when data becomes valid', () => {
    viewModel.updateField('name', 'Te');
    advanceFormTimers();
    expect(viewModel.errors$.get()).toBeInstanceOf(ZodError);

    viewModel.updateField('name', 'Valid Name');
    viewModel.updateField('email', 'valid@email.com');
    advanceFormTimers();
    expect(viewModel.errors$.get()).toBeNull();

    const fieldErrors = viewModel.fieldErrors$.get();
    expect(fieldErrors.name).toBeUndefined();
  });

  it('should correctly report field-specific errors', () => {
    viewModel.updateField('email', 'not-an-email');
    advanceFormTimers();

    const emailErrors = viewModel.getFieldErrors('email').get();
    expect(emailErrors).toEqual(['Invalid email address']);
  });

  it('isDirty$ should be false initially', () => {
    expect(viewModel.isDirty$.get()).toBe(false);
  });

  it('isDirty$ should be true after a field update', () => {
    viewModel.updateField('name', 'Something');
    expect(viewModel.isDirty$.get()).toBe(true);
  });

  it('isDirty$ should become false after resetForm', () => {
    viewModel.updateField('name', 'Something');
    expect(viewModel.isDirty$.get()).toBe(true);

    viewModel.resetForm();
    expect(viewModel.isDirty$.get()).toBe(false);
  });

  it('resetForm() should revert formData to initialData and clear errors', () => {
    viewModel.updateField('name', 'T');
    advanceFormTimers();
    expect(viewModel.errors$.get()).toBeInstanceOf(ZodError);

    viewModel.resetForm();

    expect(viewModel.formData$.get()).toEqual(initialTestData);
    expect(viewModel.errors$.get()).toBeNull();
  });

  it('setFormData() should update multiple fields and re-validate', () => {
    viewModel.setFormData({ name: 'New Name', email: 'new@example.com' });
    advanceFormTimers();

    const formData = viewModel.formData$.get();
    expect(formData.name).toBe('New Name');
    expect(formData.email).toBe('new@example.com');
    expect(viewModel.isValid$.get()).toBe(true);

    viewModel.setFormData({ email: 'invalid' });
    advanceFormTimers();
    expect(viewModel.isValid$.get()).toBe(false);

    const fieldErrors = viewModel.fieldErrors$.get();
    expect(fieldErrors.email).toContain('Invalid email address');
  });

  describe('submitCommand', () => {
    let mockSubmitHandler: ReturnType<typeof vi.fn<(data: TestData) => Promise<string>>>;
    let submitViewModel: FormViewModel<TestData, typeof testSchema, string>;

    beforeEach(() => {
      mockSubmitHandler = vi.fn(async (_data: TestData): Promise<string> => `Success: ${_data.name}`);
      submitViewModel = new FormViewModel<TestData, typeof testSchema, string>(
        initialTestData,
        testSchema,
        mockSubmitHandler,
      );
    });

    afterEach(() => {
      submitViewModel.dispose();
    });

    it('canExecute$ should be false if form is invalid', () => {
      submitViewModel.updateField('name', 'T');
      advanceFormTimers();
      expect(submitViewModel.submitCommand.canExecute$.get()).toBe(false);
    });

    it('canExecute$ should be true if form is valid', () => {
      submitViewModel.updateField('name', 'Valid Name');
      submitViewModel.updateField('email', 'valid@email.com');
      advanceFormTimers();
      expect(submitViewModel.submitCommand.canExecute$.get()).toBe(true);
    });

    it('execute should not call submitHandler if form is invalid', async () => {
      submitViewModel.updateField('name', 'T');
      advanceFormTimers();

      const result = await submitViewModel.submitCommand.execute();
      expect(mockSubmitHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Error);
      expect((result as unknown as Error).message).toBe('Form is invalid');

      const errors = submitViewModel.errors$.get();
      expect(errors).toBeInstanceOf(ZodError);
      expect((errors as ZodError).issues[0]?.path).toEqual(['name']);
    });

    it('execute should call submitHandler with validated data if form is valid', async () => {
      const validData = { name: 'Test User', email: 'test@example.com' };
      submitViewModel.updateField('name', validData.name);
      submitViewModel.updateField('email', validData.email);
      advanceFormTimers();

      const result = await submitViewModel.submitCommand.execute();
      expect(mockSubmitHandler).toHaveBeenCalledTimes(1);
      expect(mockSubmitHandler).toHaveBeenCalledWith(expect.objectContaining(validData));
      expect(result).toBe('Success: Test User');
    });

    it('execute should propagate errors from submitHandler', async () => {
      const errorMessage = 'API Error';
      mockSubmitHandler.mockRejectedValue(new Error(errorMessage));
      submitViewModel.updateField('name', 'Valid Name');
      submitViewModel.updateField('email', 'valid@email.com');
      advanceFormTimers();

      await expect(submitViewModel.submitCommand.execute()).rejects.toThrow(errorMessage);
      expect(mockSubmitHandler).toHaveBeenCalledTimes(1);
    });
  });

  it('fieldErrors$ should reflect the evolving error state distinctly', () => {
    // Initially no errors
    expect(viewModel.fieldErrors$.get()).toEqual({});

    viewModel.updateField('name', 'T');
    advanceFormTimers();
    let fieldErrors = viewModel.fieldErrors$.get();
    expect(fieldErrors.name?.[0]).toBe('Name must be at least 3 characters');

    viewModel.updateField('email', 'invalid');
    advanceFormTimers();
    fieldErrors = viewModel.fieldErrors$.get();
    expect(fieldErrors.name).toBeDefined();
    expect(fieldErrors.email?.[0]).toBe('Invalid email address');

    viewModel.updateField('email', 'valid@example.com');
    advanceFormTimers();
    fieldErrors = viewModel.fieldErrors$.get();
    expect(fieldErrors.name?.[0]).toBe('Name must be at least 3 characters');
    expect(fieldErrors.email).toBeUndefined();
  });

  it('dispose should stop validation updates', () => {
    viewModel.dispose();

    viewModel.updateField('name', 'T');
    advanceFormTimers();

    // Validation subscription is torn down — errors$ stays null
    expect(viewModel.errors$.get()).toBeNull();
  });
});
