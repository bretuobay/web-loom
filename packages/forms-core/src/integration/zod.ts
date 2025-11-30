/**
 * Advanced Zod integration utilities for forms-core
 */

import type { ZodSchema } from 'zod';
import type { FormPaths, InferFormValues, InferFormOutput } from '../types';

/**
 * Type-safe form creation helper with full Zod integration
 */
export class ZodFormBuilder<TSchema extends ZodSchema> {
  constructor(private schema: TSchema) {}

  /**
   * Create a form with type-safe paths and values
   */
  build() {
    type FormValues = InferFormValues<TSchema>;
    type FormOutput = InferFormOutput<TSchema>;
    type Paths = FormPaths<FormValues>;

    return {
      schema: this.schema,
      createField: <P extends Paths>(path: P) => {
        return new ZodFieldBuilder<TSchema, P>(this.schema, path);
      },
      getDefaultValues: (): Partial<FormValues> => {
        return extractDefaultValues(this.schema);
      },
      validatePath: (path: Paths, value: unknown): string | null => {
        return validateZodPath(this.schema, path, value);
      },
      transformValues: (values: FormValues): FormOutput => {
        const result = this.schema.safeParse(values);
        if (result.success) {
          return result.data;
        }
        throw new Error('Transformation failed: ' + JSON.stringify(result.error.issues));
      },
    };
  }
}

/**
 * Field-level Zod integration
 */
export class ZodFieldBuilder<TSchema extends ZodSchema, TPath extends string> {
  constructor(
    private schema: TSchema,
    private path: TPath,
  ) {}

  /**
   * Get field-specific schema information
   */
  getFieldInfo() {
    const fieldSchema = extractFieldSchema(this.schema, this.path);
    return {
      schema: fieldSchema,
      isOptional: isOptionalField(fieldSchema),
      isRequired: isRequiredField(fieldSchema),
      hasDefault: hasDefaultValue(fieldSchema),
      defaultValue: getDefaultValue(fieldSchema),
      validate: (value: unknown) => this.validateValue(value),
    };
  }

  /**
   * Validate field value
   */
  validateValue(value: unknown): { success: boolean; error?: string } {
    const fieldSchema = extractFieldSchema(this.schema, this.path);
    if (!fieldSchema) {
      return { success: true };
    }

    const result = fieldSchema.safeParse(value);
    if (result.success) {
      return { success: true };
    }

    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || 'Validation failed',
    };
  }
}

/**
 * Extract default values from Zod schema
 */
export function extractDefaultValues(schema: ZodSchema): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  try {
    // Try to parse empty object to see what defaults are applied
    const emptyResult = schema.safeParse({});
    if (emptyResult.success) {
      return emptyResult.data;
    }

    // If that fails, try to extract defaults manually
    if ('shape' in schema && typeof schema.shape === 'object') {
      const shape = schema.shape as Record<string, ZodSchema>;
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const defaultValue = getDefaultValue(fieldSchema);
        if (defaultValue !== undefined) {
          defaults[key] = defaultValue;
        }
      }
    }
  } catch {
    // If extraction fails, return empty object
  }

  return defaults;
}

/**
 * Extract field schema from object schema by path
 */
export function extractFieldSchema(schema: ZodSchema, path: string): ZodSchema | null {
  try {
    const pathParts = path.split('.');
    let currentSchema = schema;

    for (const part of pathParts) {
      const nextSchema = getChildSchema(currentSchema, part);
      if (!nextSchema) {
        return null;
      }
      currentSchema = nextSchema;
    }

    return currentSchema;
  } catch {
    return null;
  }
}

/**
 * Get child schema from parent schema
 */
function getChildSchema(schema: ZodSchema, key: string): ZodSchema | null {
  // Handle ZodObject
  if ('shape' in schema && typeof schema.shape === 'object') {
    const shape = schema.shape as Record<string, ZodSchema>;
    return shape[key] || null;
  }

  // Handle ZodArray with numeric key
  if ('element' in schema && /^\d+$/.test(key)) {
    return (schema as any).element;
  }

  // Handle wrapped schemas (ZodOptional, ZodNullable, ZodDefault, etc.)
  if ('_def' in schema) {
    const def = (schema as any)._def;

    if (def.innerType) {
      return getChildSchema(def.innerType, key);
    }

    if (def.schema) {
      return getChildSchema(def.schema, key);
    }
  }

  return null;
}

/**
 * Check if field is optional
 */
export function isOptionalField(schema: ZodSchema | null): boolean {
  if (!schema) return false;

  if ('_def' in schema) {
    const def = (schema as any)._def;
    return def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault';
  }

  return false;
}

/**
 * Check if field is required
 */
export function isRequiredField(schema: ZodSchema | null): boolean {
  return !isOptionalField(schema);
}

/**
 * Check if field has default value
 */
export function hasDefaultValue(schema: ZodSchema | null): boolean {
  if (!schema) return false;

  if ('_def' in schema) {
    const def = (schema as any)._def;
    return def.typeName === 'ZodDefault';
  }

  return false;
}

/**
 * Get default value from schema
 */
export function getDefaultValue(schema: ZodSchema | null): unknown {
  if (!schema) return undefined;

  try {
    if ('_def' in schema) {
      const def = (schema as any)._def;

      if (def.typeName === 'ZodDefault') {
        return typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue;
      }

      // For optional fields, undefined is the default
      if (def.typeName === 'ZodOptional') {
        return undefined;
      }
    }

    // Try to get a default by parsing undefined
    const result = schema.safeParse(undefined);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Ignore errors
  }

  return undefined;
}

/**
 * Validate specific path in schema
 */
export function validateZodPath(schema: ZodSchema, path: string, value: unknown): string | null {
  try {
    const fieldSchema = extractFieldSchema(schema, path);
    if (!fieldSchema) {
      return null;
    }

    const result = fieldSchema.safeParse(value);
    if (result.success) {
      return null;
    }

    // Return first error message
    return result.error.issues[0]?.message || 'Validation failed';
  } catch (error) {
    return error instanceof Error ? error.message : 'Validation error';
  }
}

/**
 * Create type-safe form builder from Zod schema
 */
export function createZodForm<TSchema extends ZodSchema>(schema: TSchema) {
  return new ZodFormBuilder(schema);
}

/**
 * Utility to infer form field types from Zod schema
 */
export type ZodFormFields<TSchema extends ZodSchema> = {
  [K in keyof InferFormValues<TSchema>]: {
    path: K;
    schema: ZodSchema;
    required: boolean;
    optional: boolean;
    hasDefault: boolean;
    defaultValue: unknown;
  };
};

/**
 * Generate field metadata from Zod schema
 */
export function generateFieldMetadata<TSchema extends ZodSchema>(schema: TSchema): Partial<ZodFormFields<TSchema>> {
  const metadata: Record<string, any> = {};

  try {
    if ('shape' in schema && typeof schema.shape === 'object') {
      const shape = schema.shape as Record<string, ZodSchema>;

      for (const [key, fieldSchema] of Object.entries(shape)) {
        metadata[key] = {
          path: key,
          schema: fieldSchema,
          required: isRequiredField(fieldSchema),
          optional: isOptionalField(fieldSchema),
          hasDefault: hasDefaultValue(fieldSchema),
          defaultValue: getDefaultValue(fieldSchema),
        };
      }
    }
  } catch {
    // If metadata generation fails, return empty object
  }

  return metadata as Partial<ZodFormFields<TSchema>>;
}
