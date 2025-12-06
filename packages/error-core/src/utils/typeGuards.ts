import { BaseError } from '../errors/BaseError';

// Type guards for common error types
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isBaseError(value: unknown): value is BaseError {
  return value instanceof BaseError;
}

export function isNetworkError(value: unknown): value is Error & { statusCode?: number } {
  if (!isError(value)) return false;

  const message = value.message.toLowerCase();
  const name = value.name.toLowerCase();

  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    name.includes('network') ||
    name.includes('timeout') ||
    'statusCode' in value
  );
}

export function isHttpError(value: unknown): value is Error & { statusCode: number } {
  return isError(value) && 'statusCode' in value && typeof value.statusCode === 'number';
}

export function isValidationError(value: unknown): value is Error {
  if (!isError(value)) return false;

  const message = value.message.toLowerCase();
  const name = value.name.toLowerCase();

  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    name.includes('validation') ||
    name.includes('syntax')
  );
}

export function isAuthenticationError(value: unknown): value is Error {
  if (!isError(value)) return false;

  const message = value.message.toLowerCase();
  const name = value.name.toLowerCase();
  const statusCode = (value as any).statusCode;

  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication') ||
    name.includes('auth') ||
    statusCode === 401 ||
    statusCode === 403
  );
}

export function isTimeoutError(value: unknown): value is Error {
  if (!isError(value)) return false;

  const message = value.message.toLowerCase();
  const name = value.name.toLowerCase();

  return message.includes('timeout') || name.includes('timeout') || (value as any).statusCode === 408;
}

export function isRetryableError(value: unknown): boolean {
  if (!isError(value)) return false;

  if (isBaseError(value)) {
    return value.retryable;
  }

  // Network errors are generally retryable
  if (isNetworkError(value)) {
    return true;
  }

  // 5xx errors are retryable
  if (isHttpError(value)) {
    return value.statusCode >= 500 || value.statusCode === 408 || value.statusCode === 429;
  }

  return false;
}

export function isRecoverableError(value: unknown): boolean {
  if (!isError(value)) return true; // Non-errors are recoverable

  if (isBaseError(value)) {
    return value.recoverable;
  }

  // Syntax and reference errors are generally not recoverable
  const name = value.name.toLowerCase();
  const nonRecoverableErrors = ['syntaxerror', 'referenceerror', 'typeerror', 'rangeerror'];

  return !nonRecoverableErrors.includes(name);
}

// Type guards for JavaScript built-in error types
export function isSyntaxError(value: unknown): value is SyntaxError {
  return value instanceof SyntaxError;
}

export function isReferenceError(value: unknown): value is ReferenceError {
  return value instanceof ReferenceError;
}

export function isTypeError(value: unknown): value is TypeError {
  return value instanceof TypeError;
}

export function isRangeError(value: unknown): value is RangeError {
  return value instanceof RangeError;
}

export function isEvalError(value: unknown): value is EvalError {
  return value instanceof EvalError;
}

export function isURIError(value: unknown): value is URIError {
  return value instanceof URIError;
}

// Type guards for common value types
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise || (isObject(value) && isFunction((value as any).then) && isFunction((value as any).catch))
  );
}

// Utility type guards
export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function hasMethod<K extends string>(obj: unknown, methodName: K): obj is Record<K, Function> {
  return hasProperty(obj, methodName) && isFunction((obj as any)[methodName]);
}

export function isErrorLike(value: unknown): value is Error | { message: string; name?: string; stack?: string } {
  return isError(value) || (isObject(value) && hasProperty(value, 'message') && isString(value.message));
}

export function isIterable<T = unknown>(value: unknown): value is Iterable<T> {
  return isObject(value) && Symbol.iterator in value;
}

export function isAsyncIterable<T = unknown>(value: unknown): value is AsyncIterable<T> {
  return isObject(value) && Symbol.asyncIterator in value;
}

// Advanced type guards for error properties
export function hasStatusCode(error: unknown): error is Error & { statusCode: number } {
  return isError(error) && hasProperty(error, 'statusCode') && isNumber(error.statusCode);
}

export function hasErrorCode(error: unknown): error is Error & { code: string } {
  return isError(error) && hasProperty(error, 'code') && isString(error.code);
}

export function hasCause(error: unknown): error is Error & { cause: Error } {
  return isError(error) && hasProperty(error, 'cause') && isError(error.cause);
}

export function hasUserFacingProperty(error: unknown): error is Error & { userFacing: boolean } {
  return isError(error) && hasProperty(error, 'userFacing') && isBoolean(error.userFacing);
}

export function hasRetryableProperty(error: unknown): error is Error & { retryable: boolean } {
  return isError(error) && hasProperty(error, 'retryable') && isBoolean(error.retryable);
}
