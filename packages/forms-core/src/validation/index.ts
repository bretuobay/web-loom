/**
 * Core validation utilities for forms-core
 */

import type { ZodSchema, ZodError } from 'zod';

// Export ErrorsContainer classes
export { ErrorsContainer } from './ErrorsContainer';
export { AsyncErrorsContainer } from './AsyncErrorsContainer';
export { 
  populateFromZodError, 
  validateWithZodContainer, 
  validateFieldWithZodContainer 
} from './zodHelpers';
import type { FormErrors, ValidationResult, AsyncValidatorConfig } from '../types';

/**
 * Validate a value against a Zod schema
 */
export function validateWithZod<T>(schema: ZodSchema<T>, value: unknown): ValidationResult<T> {
  try {
    const result = schema.safeParse(value);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: { fieldErrors: {}, formErrors: [] },
      };
    }

    const formErrors = formatZodErrors(result.error);
    return {
      success: false,
      data: null,
      errors: formErrors,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: {
        fieldErrors: {},
        formErrors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      },
    };
  }
}

/**
 * Format Zod validation errors into our FormErrors format
 */
export function formatZodErrors(zodError: ZodError): FormErrors {
  const fieldErrors: Record<string, string> = {};
  const formErrors: string[] = [];

  for (const issue of zodError.issues) {
    if (issue.path.length === 0) {
      // Root level error
      formErrors.push(issue.message);
    } else {
      // Field specific error
      const fieldPath = issue.path.join('.');
      fieldErrors[fieldPath] = issue.message;
    }
  }

  return { fieldErrors, formErrors };
}

/**
 * Async validator wrapper with abort signal support
 */
export class AsyncValidator {
  private abortController: AbortController | null = null;
  private cache = new Map<string, { result: string | null; timestamp: number }>();

  constructor(private config: AsyncValidatorConfig) {}

  async validate(value: unknown, context?: { values: unknown }): Promise<string | null> {
    // Abort any pending validation
    if (this.abortController) {
      this.abortController.abort();
    }

    // Check cache if enabled
    if (this.config.cache) {
      const cacheKey = JSON.stringify(value);
      const cached = this.cache.get(cacheKey);
      const ttl = this.config.cacheTTL || 300000; // 5 minutes default

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    // Create new abort controller
    this.abortController = new AbortController();
    const currentController = this.abortController;

    try {
      const result = await this.config.validator(value, {
        signal: currentController.signal,
        values: context?.values,
      });

      if (currentController.signal.aborted) {
        return null;
      }

      // Cache result if enabled
      if (this.config.cache) {
        const cacheKey = JSON.stringify(value);
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Validation was aborted, return null (no error)
        return null;
      }
      // Re-throw other errors
      throw error;
    } finally {
      if (this.abortController === currentController) {
        this.abortController = null;
      }
    }
  }

  /**
   * Cancel any pending validation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancel();
    this.clearCache();
  }
}

/**
 * Debounce function for validation delays
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let latestResolve: ((value: ReturnType<T>) => void) | null = null;
  let latestReject: ((reason: any) => void) | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const pendingPromise = new Promise<ReturnType<T>>((resolve, reject) => {
      // Clear existing timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Cancel previous promise if it exists
      if (latestReject) {
        latestReject(new Error('Debounced call cancelled'));
        latestReject = null;
        latestResolve = null;
      }

      latestResolve = resolve;
      latestReject = reject;

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (latestResolve) {
            latestResolve(result);
            latestResolve = null;
            latestReject = null;
          }
        } catch (error) {
          if (latestReject) {
            latestReject(error);
            latestResolve = null;
            latestReject = null;
          }
        } finally {
          timeout = null;
        }
      }, wait);
    });

    // Prevent unhandled rejections for cancelled calls
    pendingPromise.catch(() => {});

    return pendingPromise;
  };
}

/**
 * Validate single field value
 */
export function validateField(schema: ZodSchema, path: string, value: unknown, allValues?: unknown): string | null {
  try {
    // For nested fields, we need to validate the entire object
    // but only return errors for the specific field
    if (path.includes('.')) {
      const result = schema.safeParse(allValues);
      if (!result.success) {
        const formErrors = formatZodErrors(result.error);
        return formErrors.fieldErrors[path] || null;
      }
      return null;
    } else {
      // For top-level fields, we can validate the field directly
      // First try to get the field schema
      const fieldSchema = getFieldSchema(schema, path);
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          const formErrors = formatZodErrors(result.error);
          // Return the first error for this field
          return Object.values(formErrors.fieldErrors)[0] || formErrors.formErrors[0] || null;
        }
      }
      return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Validation error';
  }
}

/**
 * Extract field schema from a Zod object schema
 * This is a simplified version - in a real implementation you'd need more robust schema introspection
 */
function getFieldSchema(schema: ZodSchema, path: string): ZodSchema | null {
  try {
    // This is a simplified implementation
    // In practice, you'd need to traverse the schema structure
    if ('shape' in schema && typeof schema.shape === 'object') {
      const shape = schema.shape as Record<string, ZodSchema>;
      return shape[path] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Merge multiple validation error objects
 */
export function mergeValidationErrors(...errors: FormErrors[]): FormErrors {
  const merged: FormErrors = {
    fieldErrors: {},
    formErrors: [],
  };

  for (const error of errors) {
    // Merge field errors
    Object.assign(merged.fieldErrors, error.fieldErrors);

    // Merge form errors (avoid duplicates)
    for (const formError of error.formErrors) {
      if (!merged.formErrors.includes(formError)) {
        merged.formErrors.push(formError);
      }
    }
  }

  return merged;
}

/**
 * Check if validation errors object has any errors
 */
export function hasValidationErrors(errors: FormErrors): boolean {
  return Object.keys(errors.fieldErrors).length > 0 || errors.formErrors.length > 0;
}

/**
 * Clear validation errors for specific paths
 */
export function clearValidationErrors(errors: FormErrors, paths: string[]): FormErrors {
  const clearedFieldErrors = { ...errors.fieldErrors };

  for (const path of paths) {
    delete clearedFieldErrors[path];
  }

  return {
    fieldErrors: clearedFieldErrors,
    formErrors: [...errors.formErrors], // Keep form errors as they're not path-specific
  };
}
