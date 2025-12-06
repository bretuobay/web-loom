import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  constructor(
    message: string,
    options: {
      field?: string;
      validationType?: string;
      value?: unknown;
      rule?: string;
      cause?: Error;
      errors?: ValidationError[];
    } = {},
  ) {
    super(message, {
      name: 'ValidationError',
      code: 'VALIDATION_ERROR',
      category: 'validation',
      severity: 'warn',
      retryable: false,
      recoverable: true,
      userFacing: true,
      cause: options.cause,
      context: {
        field: options.field,
        validationType: options.validationType,
        value: options.value,
        rule: options.rule,
        errors: options.errors?.map((e) => e.toJSON()),
      },
    });
  }

  get field(): string | undefined {
    return this.context.field as string;
  }

  get validationType(): string | undefined {
    return this.context.validationType as string;
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(
    fieldName: string,
    options: {
      value?: unknown;
      cause?: Error;
    } = {},
  ) {
    super(`Field '${fieldName}' is required`, {
      field: fieldName,
      validationType: 'required',
      value: options.value,
      rule: 'required',
      cause: options.cause,
    });
  }
}

export class FormatError extends ValidationError {
  constructor(
    fieldName: string,
    expectedFormat: string,
    options: {
      value?: unknown;
      cause?: Error;
    } = {},
  ) {
    super(`Field '${fieldName}' does not match expected format: ${expectedFormat}`, {
      field: fieldName,
      validationType: 'format',
      value: options.value,
      rule: expectedFormat,
      cause: options.cause,
    });
  }
}

export class RangeError extends ValidationError {
  constructor(
    fieldName: string,
    min?: number,
    max?: number,
    options: {
      value?: unknown;
      cause?: Error;
    } = {},
  ) {
    const rangeText =
      min !== undefined && max !== undefined
        ? `between ${min} and ${max}`
        : min !== undefined
          ? `greater than or equal to ${min}`
          : max !== undefined
            ? `less than or equal to ${max}`
            : 'within valid range';

    super(`Field '${fieldName}' must be ${rangeText}`, {
      field: fieldName,
      validationType: 'range',
      value: options.value,
      rule: `min:${min},max:${max}`,
      cause: options.cause,
    });
  }
}
