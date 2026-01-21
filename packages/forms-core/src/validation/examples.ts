/**
 * Examples demonstrating ErrorsContainer and AsyncErrorsContainer usage
 */

import { z } from 'zod';
import { ErrorsContainer } from './ErrorsContainer';
import { AsyncErrorsContainer } from './AsyncErrorsContainer';
import { validateWithZodContainer, validateFieldWithZodContainer } from './zodHelpers';

// ============================================================================
// Example 1: Basic ErrorsContainer Usage
// ============================================================================

interface LoginForm {
  email: string;
  password: string;
}

export function basicErrorsContainerExample() {
  const errors = new ErrorsContainer<LoginForm>();

  // Set errors manually
  errors.setErrors('email', ['Email is required']);
  errors.setErrors('password', ['Password must be at least 8 characters']);

  console.log('Email errors:', errors.getErrors('email'));
  console.log('Has errors:', errors.hasErrors);

  // Subscribe to errors
  const subscription = errors.getErrors$('email').subscribe((emailErrors) => {
    console.log('Email errors changed:', emailErrors);
  });

  // Clear errors
  errors.clearErrors('email');

  // Cleanup
  subscription.unsubscribe();
  errors.dispose();
}

// ============================================================================
// Example 2: Zod Integration
// ============================================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function zodIntegrationExample() {
  const errors = new ErrorsContainer<LoginFormData>();

  // Validate entire form
  const formData = {
    email: 'invalid-email',
    password: '123',
  };

  const isValid = validateWithZodContainer(errors, loginSchema, formData);

  console.log('Is valid:', isValid);
  console.log('Email errors:', errors.getErrors('email'));
  console.log('Password errors:', errors.getErrors('password'));
  console.log('All errors:', errors.getAllErrorsAsRecord());

  errors.dispose();
}

// ============================================================================
// Example 3: Field-Level Validation
// ============================================================================

export function fieldLevelValidationExample() {
  const errors = new ErrorsContainer<LoginFormData>();

  const currentData: Partial<LoginFormData> = {
    email: '',
    password: 'validpassword123',
  };

  // Validate only email field
  const isEmailValid = validateFieldWithZodContainer(errors, loginSchema, 'email', 'test@example.com', currentData);

  console.log('Email valid:', isEmailValid);
  console.log('Email errors:', errors.getErrors('email'));
  console.log('Password errors:', errors.getErrors('password')); // Empty - not validated

  errors.dispose();
}

// ============================================================================
// Example 4: Async Validation
// ============================================================================

export async function asyncValidationExample() {
  const errors = new AsyncErrorsContainer<LoginFormData>();

  // Simulate async email uniqueness check
  await errors.validateAsync('email', 'test@example.com', async (email: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if email exists
    const emailExists = email === 'existing@example.com';
    return emailExists ? ['Email already registered'] : [];
  });

  console.log('Email errors:', errors.getErrors('email'));

  errors.dispose();
}

// ============================================================================
// Example 5: Debounced Async Validation
// ============================================================================

export function debouncedValidationExample() {
  const errors = new AsyncErrorsContainer<LoginFormData>();

  // Simulate user typing
  const emailInputs = ['t', 'te', 'tes', 'test', 'test@', 'test@example.com'];

  emailInputs.forEach((email, index) => {
    setTimeout(() => {
      // This will debounce - only the last call will execute
      errors.validateAsyncDebounced(
        'email',
        email,
        async (value: string) => {
          console.log('Validating:', value);
          await new Promise((resolve) => setTimeout(resolve, 50));
          return value.includes('@') ? [] : ['Invalid email'];
        },
        300, // 300ms debounce
      );
    }, index * 50);
  });

  // Cleanup after 2 seconds
  setTimeout(() => {
    errors.dispose();
  }, 2000);
}

// ============================================================================
// Example 6: Form ViewModel with ErrorsContainer
// ============================================================================

const registrationSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegistrationFormData = z.infer<typeof registrationSchema>;

export class RegistrationFormViewModel {
  private errors = new ErrorsContainer<RegistrationFormData>();
  private formData: Partial<RegistrationFormData> = {};

  // Expose observables for view binding
  public readonly usernameErrors$ = this.errors.getErrors$('username');
  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly passwordErrors$ = this.errors.getErrors$('password');
  public readonly confirmPasswordErrors$ = this.errors.getErrors$('confirmPassword');
  public readonly hasErrors$ = this.errors.hasErrors$;

  updateField<K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]): void {
    this.formData[field] = value;

    // Validate field
    validateFieldWithZodContainer(this.errors, registrationSchema, field, value, this.formData);
  }

  submit(): boolean {
    // Validate entire form
    const isValid = validateWithZodContainer(this.errors, registrationSchema, this.formData);

    if (!isValid) {
      console.log('Form has errors:', this.errors.getAllErrorsAsRecord());
      return false;
    }

    console.log('Form is valid, submitting:', this.formData);
    return true;
  }

  dispose(): void {
    this.errors.dispose();
  }
}

// ============================================================================
// Example 7: Async Email Uniqueness Validator
// ============================================================================

export class EmailUniquenessValidator {
  private errors = new AsyncErrorsContainer<{ email: string }>();
  private cancelValidation: (() => void) | null = null;

  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly isValidating$ = this.errors.isValidating$;

  validateEmail(email: string): void {
    // Cancel previous validation
    this.cancelValidation?.();

    // Basic format check first
    if (!email.includes('@')) {
      this.errors.setErrors('email', ['Invalid email format']);
      return;
    }

    // Debounced async validation
    this.cancelValidation = this.errors.validateAsyncDebounced(
      'email',
      email,
      async (value: string) => {
        // Simulate API call to check uniqueness
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simulate checking against existing emails
        const existingEmails = ['existing@example.com', 'taken@example.com'];
        const exists = existingEmails.includes(value);

        return exists ? ['Email already registered'] : [];
      },
      500, // 500ms debounce
    );
  }

  dispose(): void {
    this.cancelValidation?.();
    this.errors.dispose();
  }
}

// ============================================================================
// Example 8: Multi-Field Validation with Dependencies
// ============================================================================

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

export class PasswordChangeViewModel {
  private errors = new ErrorsContainer<PasswordChangeData>();
  private formData: Partial<PasswordChangeData> = {};

  public readonly currentPasswordErrors$ = this.errors.getErrors$('currentPassword');
  public readonly newPasswordErrors$ = this.errors.getErrors$('newPassword');
  public readonly confirmNewPasswordErrors$ = this.errors.getErrors$('confirmNewPassword');

  updateCurrentPassword(value: string): void {
    this.formData.currentPassword = value;
    this.validateField('currentPassword', value);
  }

  updateNewPassword(value: string): void {
    this.formData.newPassword = value;
    this.validateField('newPassword', value);

    // Re-validate confirm password if it has a value
    if (this.formData.confirmNewPassword) {
      this.validateField('confirmNewPassword', this.formData.confirmNewPassword);
    }
  }

  updateConfirmNewPassword(value: string): void {
    this.formData.confirmNewPassword = value;
    this.validateField('confirmNewPassword', value);
  }

  private validateField<K extends keyof PasswordChangeData>(field: K, value: PasswordChangeData[K]): void {
    validateFieldWithZodContainer(this.errors, passwordChangeSchema, field, value, this.formData);
  }

  async submit(): Promise<boolean> {
    const isValid = validateWithZodContainer(this.errors, passwordChangeSchema, this.formData);

    if (!isValid) {
      return false;
    }

    // Submit password change
    console.log('Changing password...');
    return true;
  }

  dispose(): void {
    this.errors.dispose();
  }
}

// ============================================================================
// Example 9: Real-Time Validation with Observable Streams
// ============================================================================

export class RealTimeFormValidator {
  private errors = new ErrorsContainer<LoginFormData>();

  public readonly emailErrors$ = this.errors.getErrors$('email');
  public readonly passwordErrors$ = this.errors.getErrors$('password');
  public readonly hasAnyErrors$ = this.errors.hasErrors$;

  // Get first error only (for single error display)
  public readonly emailFirstError$ = this.errors.getFirstError$('email');
  public readonly passwordFirstError$ = this.errors.getFirstError$('password');

  // Check if specific field has errors
  public readonly hasEmailErrors$ = this.errors.hasPropertyErrors$('email');
  public readonly hasPasswordErrors$ = this.errors.hasPropertyErrors$('password');

  validateEmail(email: string): void {
    validateFieldWithZodContainer(this.errors, loginSchema, 'email', email, { email, password: '' });
  }

  validatePassword(password: string): void {
    validateFieldWithZodContainer(this.errors, loginSchema, 'password', password, { email: '', password });
  }

  dispose(): void {
    this.errors.dispose();
  }
}

// ============================================================================
// Example 10: Cancellable Async Validation
// ============================================================================

export class CancellableValidator {
  private errors = new AsyncErrorsContainer<{ username: string }>();

  public readonly usernameErrors$ = this.errors.getErrors$('username');
  public readonly isValidating$ = this.errors.isValidating$;

  async validateUsername(username: string): Promise<void> {
    // This will cancel any previous validation for username
    await this.errors.validateAsync('username', username, async (value: string) => {
      // Simulate slow API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check availability
      const taken = ['admin', 'user', 'test'];
      return taken.includes(value.toLowerCase()) ? ['Username is already taken'] : [];
    });
  }

  cancelValidation(): void {
    this.errors.cancelPendingValidation('username');
  }

  dispose(): void {
    this.errors.dispose();
  }
}
