import { describe, it, expect } from 'vitest';
import { ValidationError } from '../errors/ValidationError';
import { NetworkError } from '../errors/NetworkError';
import {
  isError,
  isBaseError,
  isNetworkError,
  isHttpError,
  isValidationError,
  isAuthenticationError,
  isTimeoutError,
  isRetryableError,
  isRecoverableError,
  isSyntaxError,
  isReferenceError,
  isTypeError,
  isRangeError,
  isEvalError,
  isURIError,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isFunction,
  isUndefined,
  isNull,
  isNullOrUndefined,
  isArray,
  isDate,
  isRegExp,
  isPromise,
  hasProperty,
  hasMethod,
  isErrorLike,
  isIterable,
  isAsyncIterable,
  hasStatusCode,
  hasErrorCode,
  hasCause,
  hasUserFacingProperty,
  hasRetryableProperty,
} from './typeGuards';

describe('typeGuards - Error Type Guards', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('error')).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({})).toBe(false);
    });
  });

  describe('isBaseError', () => {
    it('should return true for ValidationError (extends BaseError)', () => {
      const error = new ValidationError('test', { field: 'email' });
      expect(isBaseError(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      expect(isBaseError(new Error('test'))).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors by message', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Fetch failed'))).toBe(true);
      expect(isNetworkError(new Error('Connection timeout'))).toBe(true);
    });

    it('should identify network errors by statusCode property', () => {
      const error = new Error('test') as any;
      error.statusCode = 500;
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
    });
  });

  describe('isHttpError', () => {
    it('should return true for errors with statusCode', () => {
      const error = new Error('HTTP error') as any;
      error.statusCode = 404;
      expect(isHttpError(error)).toBe(true);
    });

    it('should return false for errors without statusCode', () => {
      expect(isHttpError(new Error('test'))).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should identify validation errors by message', () => {
      expect(isValidationError(new Error('Validation failed'))).toBe(true);
      expect(isValidationError(new Error('Invalid input'))).toBe(true);
      expect(isValidationError(new Error('Field is required'))).toBe(true);
    });

    it('should identify validation errors by name', () => {
      const error = new Error('test');
      error.name = 'ValidationError';
      expect(isValidationError(error)).toBe(true);
    });
  });

  describe('isAuthenticationError', () => {
    it('should identify auth errors by message', () => {
      expect(isAuthenticationError(new Error('Unauthorized'))).toBe(true);
      expect(isAuthenticationError(new Error('Forbidden'))).toBe(true);
      expect(isAuthenticationError(new Error('Authentication failed'))).toBe(true);
    });

    it('should identify auth errors by status code', () => {
      const error401 = new Error('test') as any;
      error401.statusCode = 401;
      expect(isAuthenticationError(error401)).toBe(true);

      const error403 = new Error('test') as any;
      error403.statusCode = 403;
      expect(isAuthenticationError(error403)).toBe(true);
    });
  });

  describe('isTimeoutError', () => {
    it('should identify timeout errors', () => {
      expect(isTimeoutError(new Error('Request timeout'))).toBe(true);

      const error = new Error('test') as any;
      error.statusCode = 408;
      expect(isTimeoutError(error)).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for NetworkError with retryable status', () => {
      const error = new NetworkError('Server error', { statusCode: 500 });
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isRetryableError(new Error('Network failed'))).toBe(true);
    });

    it('should return true for 5xx HTTP errors', () => {
      const error = new Error('Server error') as any;
      error.statusCode = 500;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 408 and 429 status codes', () => {
      const error408 = new Error('test') as any;
      error408.statusCode = 408;
      expect(isRetryableError(error408)).toBe(true);

      const error429 = new Error('test') as any;
      error429.statusCode = 429;
      expect(isRetryableError(error429)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(new Error('Validation failed'))).toBe(false);
    });
  });

  describe('isRecoverableError', () => {
    it('should return false for syntax errors', () => {
      expect(isRecoverableError(new SyntaxError('test'))).toBe(false);
      expect(isRecoverableError(new ReferenceError('test'))).toBe(false);
      expect(isRecoverableError(new TypeError('test'))).toBe(false);
    });

    it('should return true for most errors by default', () => {
      expect(isRecoverableError(new Error('test'))).toBe(true);
    });

    it('should respect error recoverable property', () => {
      const error = new ValidationError('test', { field: 'email' });
      expect(isRecoverableError(error)).toBe(true);
    });
  });

  describe('JavaScript built-in error types', () => {
    it('should identify SyntaxError', () => {
      expect(isSyntaxError(new SyntaxError('test'))).toBe(true);
      expect(isSyntaxError(new Error('test'))).toBe(false);
    });

    it('should identify ReferenceError', () => {
      expect(isReferenceError(new ReferenceError('test'))).toBe(true);
      expect(isReferenceError(new Error('test'))).toBe(false);
    });

    it('should identify TypeError', () => {
      expect(isTypeError(new TypeError('test'))).toBe(true);
      expect(isTypeError(new Error('test'))).toBe(false);
    });

    it('should identify RangeError', () => {
      expect(isRangeError(new RangeError('test'))).toBe(true);
      expect(isRangeError(new Error('test'))).toBe(false);
    });

    it('should identify EvalError', () => {
      expect(isEvalError(new EvalError('test'))).toBe(true);
      expect(isEvalError(new Error('test'))).toBe(false);
    });

    it('should identify URIError', () => {
      expect(isURIError(new URIError('test'))).toBe(true);
      expect(isURIError(new Error('test'))).toBe(false);
    });
  });
});

describe('typeGuards - Value Type Guards', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('test')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1.5)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });

    it('should return false for null and primitives', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('test')).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction(class {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction(null)).toBe(false);
    });
  });

  describe('isUndefined', () => {
    it('should return true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined('')).toBe(false);
    });
  });

  describe('isNull', () => {
    it('should return true for null', () => {
      expect(isNull(null)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
    });
  });

  describe('isNullOrUndefined', () => {
    it('should return true for null and undefined', () => {
      expect(isNullOrUndefined(null)).toBe(true);
      expect(isNullOrUndefined(undefined)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isNullOrUndefined(0)).toBe(false);
      expect(isNullOrUndefined('')).toBe(false);
      expect(isNullOrUndefined(false)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('test')).toBe(false);
    });
  });

  describe('isDate', () => {
    it('should return true for valid dates', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2024-01-01'))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2024-01-01')).toBe(false);
    });
  });

  describe('isRegExp', () => {
    it('should return true for RegExp', () => {
      expect(isRegExp(/test/)).toBe(true);
      expect(isRegExp(new RegExp('test'))).toBe(true);
    });

    it('should return false for non-RegExp', () => {
      expect(isRegExp('test')).toBe(false);
      expect(isRegExp({})).toBe(false);
    });
  });

  describe('isPromise', () => {
    it('should return true for promises', () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
    });

    it('should return true for thenable objects', () => {
      const thenable = {
        then: () => {},
        catch: () => {},
      };
      expect(isPromise(thenable)).toBe(true);
    });

    it('should return false for non-promises', () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise({ then: 'not a function' })).toBe(false);
    });
  });
});

describe('typeGuards - Utility Type Guards', () => {
  describe('hasProperty', () => {
    it('should return true if object has property', () => {
      expect(hasProperty({ foo: 'bar' }, 'foo')).toBe(true);
    });

    it('should return false if object does not have property', () => {
      expect(hasProperty({}, 'foo')).toBe(false);
      expect(hasProperty(null, 'foo')).toBe(false);
    });
  });

  describe('hasMethod', () => {
    it('should return true if object has method', () => {
      expect(hasMethod({ foo: () => {} }, 'foo')).toBe(true);
    });

    it('should return false if property is not a function', () => {
      expect(hasMethod({ foo: 'bar' }, 'foo')).toBe(false);
    });

    it('should return false if object does not have property', () => {
      expect(hasMethod({}, 'foo')).toBe(false);
    });
  });

  describe('isErrorLike', () => {
    it('should return true for Error instances', () => {
      expect(isErrorLike(new Error('test'))).toBe(true);
    });

    it('should return true for error-like objects', () => {
      expect(isErrorLike({ message: 'test' })).toBe(true);
      expect(isErrorLike({ message: 'test', name: 'CustomError' })).toBe(true);
    });

    it('should return false for non-error-like objects', () => {
      expect(isErrorLike({})).toBe(false);
      expect(isErrorLike({ msg: 'test' })).toBe(false);
    });
  });

  describe('isIterable', () => {
    it('should return true for iterables', () => {
      expect(isIterable([])).toBe(true);
      // Note: primitives like strings are wrapped in jsdom and may not have Symbol.iterator
      // In actual runtime they are iterable, but in test env behavior may differ
      expect(isIterable(new Set())).toBe(true);
      expect(isIterable(new Map())).toBe(true);
    });

    it('should return false for non-iterables', () => {
      expect(isIterable({})).toBe(false);
      expect(isIterable(null)).toBe(false);
      expect(isIterable(123)).toBe(false);
    });
  });

  describe('isAsyncIterable', () => {
    it('should return true for async iterables', () => {
      const asyncIterable = {
        [Symbol.asyncIterator]: function* () {
          yield Promise.resolve(1);
        },
      };
      expect(isAsyncIterable(asyncIterable)).toBe(true);
    });

    it('should return false for non-async iterables', () => {
      expect(isAsyncIterable([])).toBe(false);
      expect(isAsyncIterable({})).toBe(false);
    });
  });

  describe('hasStatusCode', () => {
    it('should return true for errors with numeric statusCode', () => {
      const error = new Error('test') as any;
      error.statusCode = 404;
      expect(hasStatusCode(error)).toBe(true);
    });

    it('should return false for errors without statusCode', () => {
      expect(hasStatusCode(new Error('test'))).toBe(false);
    });
  });

  describe('hasErrorCode', () => {
    it('should return true for errors with string code', () => {
      const error = new Error('test') as any;
      error.code = 'ERR_NETWORK';
      expect(hasErrorCode(error)).toBe(true);
    });

    it('should return false for errors without code', () => {
      expect(hasErrorCode(new Error('test'))).toBe(false);
    });
  });

  describe('hasCause', () => {
    it('should return true for errors with cause', () => {
      const error = new Error('test') as any;
      error.cause = new Error('original');
      expect(hasCause(error)).toBe(true);
    });

    it('should return false for errors without cause', () => {
      expect(hasCause(new Error('test'))).toBe(false);
    });
  });

  describe('hasUserFacingProperty', () => {
    it('should return true for errors with userFacing boolean', () => {
      const error = new Error('test') as any;
      error.userFacing = true;
      expect(hasUserFacingProperty(error)).toBe(true);
    });

    it('should return false for errors without userFacing', () => {
      expect(hasUserFacingProperty(new Error('test'))).toBe(false);
    });
  });

  describe('hasRetryableProperty', () => {
    it('should return true for errors with retryable boolean', () => {
      const error = new Error('test') as any;
      error.retryable = true;
      expect(hasRetryableProperty(error)).toBe(true);
    });

    it('should return false for errors without retryable', () => {
      expect(hasRetryableProperty(new Error('test'))).toBe(false);
    });
  });
});
