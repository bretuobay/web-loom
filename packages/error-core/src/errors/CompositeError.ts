import { BaseError } from './BaseError';
import type { ErrorSeverity } from '../types/error.types';

export class CompositeError extends BaseError {
  public readonly errors: BaseError[];

  constructor(
    message: string,
    errors: BaseError[],
    options: {
      code?: string;
      operation?: string;
      cause?: Error;
    } = {},
  ) {
    const highestSeverity = CompositeError.getHighestSeverity(errors);

    super(message, {
      name: 'CompositeError',
      code: options.code || 'MULTIPLE_ERRORS',
      category: 'runtime',
      severity: highestSeverity,
      retryable: errors.some((e) => e.retryable),
      recoverable: errors.every((e) => e.recoverable),
      userFacing: errors.some((e) => e.userFacing),
      cause: options.cause,
      context: {
        operation: options.operation,
        errorCount: errors.length,
        categories: [...new Set(errors.map((e) => e.category))],
        codes: [...new Set(errors.map((e) => e.code))],
      },
    });

    this.errors = [...errors];
  }

  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors.map((e) => e.toJSON()),
    };
  }

  public getErrorsByCategory(category: string): BaseError[] {
    return this.errors.filter((e) => e.category === category);
  }

  public getErrorsByCode(code: string): BaseError[] {
    return this.errors.filter((e) => e.code === code);
  }

  public hasErrorsOfType<T extends BaseError>(errorClass: new (...args: any[]) => T): boolean {
    return this.errors.some((e) => e instanceof errorClass);
  }

  public getErrorsOfType<T extends BaseError>(errorClass: new (...args: any[]) => T): T[] {
    return this.errors.filter((e) => e instanceof errorClass) as T[];
  }

  private static getHighestSeverity(errors: BaseError[]): ErrorSeverity {
    const severityLevels: Record<ErrorSeverity, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4,
    };

    let highest: ErrorSeverity = 'debug';
    let highestLevel = 0;

    for (const error of errors) {
      const level = severityLevels[error.severity];
      if (level > highestLevel) {
        highest = error.severity;
        highestLevel = level;
      }
    }

    return highest;
  }
}

export class AggregateError extends CompositeError {
  constructor(errors: BaseError[], operation?: string) {
    const message = `Multiple errors occurred during ${operation || 'operation'} (${errors.length} errors)`;

    super(message, errors, {
      code: 'AGGREGATE_ERROR',
      operation,
    });
  }
}
