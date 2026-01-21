import { ZodError, ZodSchema } from 'zod';
import { ErrorsContainer } from './ErrorsContainer';

/**
 * Populate ErrorsContainer from a ZodError
 */
export function populateFromZodError<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  zodError: ZodError,
): void {
  // Clear previous errors
  container.clearErrors();

  // Group errors by field path
  const errorsByField = new Map<keyof T, string[]>();

  zodError.errors.forEach((err) => {
    const propertyName = err.path[0] as keyof T;
    if (propertyName) {
      const existing = errorsByField.get(propertyName) || [];
      existing.push(err.message);
      errorsByField.set(propertyName, existing);
    }
  });

  // Set errors for each field
  errorsByField.forEach((errors, propertyName) => {
    container.setErrors(propertyName, errors);
  });
}

/**
 * Validate data against Zod schema and populate ErrorsContainer.
 *
 * @returns true if valid, false if errors
 */
export function validateWithZodContainer<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  schema: ZodSchema<T>,
  data: Partial<T>,
): boolean {
  const result = schema.safeParse(data);

  if (result.success) {
    container.clearErrors();
    return true;
  } else {
    populateFromZodError(container, result.error);
    return false;
  }
}

/**
 * Validate a single field against Zod schema.
 * Only sets errors for the specified field.
 *
 * @returns true if field is valid, false if has errors
 */
export function validateFieldWithZodContainer<T extends Record<string, any>>(
  container: ErrorsContainer<T>,
  schema: ZodSchema<T>,
  propertyName: keyof T,
  value: T[keyof T],
  currentData: Partial<T>,
): boolean {
  const dataToValidate = { ...currentData, [propertyName]: value } as T;
  const result = schema.safeParse(dataToValidate);

  if (result.success) {
    container.setErrors(propertyName, []);
    return true;
  } else {
    const fieldErrors = result.error.errors.filter((err) => err.path[0] === propertyName).map((err) => err.message);

    container.setErrors(propertyName, fieldErrors);
    return fieldErrors.length === 0;
  }
}
