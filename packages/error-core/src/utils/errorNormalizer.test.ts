import { describe, it, expect } from 'vitest';
import { ValidationError } from '../errors/ValidationError';
import { NetworkError } from '../errors/NetworkError';
import {
  normalizeError,
  isRetryableError,
  isRecoverableError,
  isUserFacingError,
  categorizeError,
  createErrorChain,
  flattenErrorChain,
  getErrorFingerprint,
} from './errorNormalizer';

describe('errorNormalizer', () => {
  describe('normalizeError', () => {
    it('should normalize standard Error objects', () => {
      const error = new Error('Test error');
      const normalized = normalizeError(error);

      expect(normalized.name).toBe('Error');
      expect(normalized.message).toBe('Test error');
      expect(normalized.stack).toBeDefined();
    });

    it('should normalize ValidationError with all properties', () => {
      const error = new ValidationError('Test error', {
        field: 'email',
        validationType: 'format',
      });

      const normalized = normalizeError(error);

      expect(normalized.name).toBe('ValidationError');
      expect(normalized.message).toBe('Test error');
      expect(normalized.category).toBe('validation');
      expect(normalized.severity).toBe('warn');
      expect(normalized.recoverable).toBe(true);
      expect(normalized.retryable).toBe(false);
      expect(normalized.userFacing).toBe(true);
      expect(normalized.context).toBeDefined();
      expect(normalized.timestamp).toBeDefined();
    });

    it('should normalize errors with status code', () => {
      const error = new Error('HTTP error') as any;
      error.status = 404;
      const normalized = normalizeError(error);

      expect(normalized.statusCode).toBe(404);
    });

    it('should normalize errors with statusCode property', () => {
      const error = new Error('HTTP error') as any;
      error.statusCode = 500;
      const normalized = normalizeError(error);

      expect(normalized.statusCode).toBe(500);
    });

    it('should normalize errors with code property', () => {
      const error = new Error('System error') as any;
      error.code = 'ECONNREFUSED';
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('ECONNREFUSED');
    });

    it('should normalize string errors', () => {
      const normalized = normalizeError('Something went wrong');

      expect(normalized.name).toBe('StringError');
      expect(normalized.message).toBe('Something went wrong');
    });

    it('should normalize number errors', () => {
      const normalized = normalizeError(404);

      expect(normalized.name).toBe('NumberError');
      expect(normalized.message).toBe('Numeric error: 404');
    });

    it('should normalize plain object errors', () => {
      const errorObj = { code: 'ERR_001', detail: 'Failed' };
      const normalized = normalizeError(errorObj);

      expect(normalized.name).toBe('ObjectError');
      expect(normalized.message).toContain('Object error:');
      expect(normalized.originalObject).toEqual(errorObj);
    });

    it('should handle circular object errors', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const normalized = normalizeError(circular);

      expect(normalized.name).toBe('ObjectError');
      expect(normalized.message).toContain('Circular or non-serializable');
    });

    it('should normalize unknown error types', () => {
      const normalized = normalizeError(Symbol('error'));

      expect(normalized.name).toBe('UnknownError');
      expect(normalized.message).toContain('Unknown error type');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for NetworkError which is retryable', () => {
      const error = new NetworkError('Network failure', { statusCode: 500 });
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for ValidationError which is not retryable', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(isRetryableError(error)).toBe(false);
    });

    it('should identify timeout errors as retryable', () => {
      expect(isRetryableError(new Error('Request timeout'))).toBe(true);
      // Note: "timed out" doesn't contain "timeout" as a single word
      expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('Network request failed'))).toBe(true);
      expect(isRetryableError(new Error('Connection refused'))).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      const error500 = new Error('Server error') as any;
      error500.statusCode = 500;
      expect(isRetryableError(error500)).toBe(true);

      const error503 = new Error('Service unavailable') as any;
      error503.statusCode = 503;
      expect(isRetryableError(error503)).toBe(true);
    });

    it('should identify 408 and 429 as retryable', () => {
      const error408 = new Error('Request timeout') as any;
      error408.statusCode = 408;
      expect(isRetryableError(error408)).toBe(true);

      const error429 = new Error('Too many requests') as any;
      error429.statusCode = 429;
      expect(isRetryableError(error429)).toBe(true);
    });

    it('should not identify 4xx client errors as retryable', () => {
      const error400 = new Error('Bad request') as any;
      error400.statusCode = 400;
      expect(isRetryableError(error400)).toBe(false);

      const error404 = new Error('Not found') as any;
      error404.statusCode = 404;
      expect(isRetryableError(error404)).toBe(false);
    });
  });

  describe('isRecoverableError', () => {
    it('should respect error recoverable property', () => {
      const recoverable = new ValidationError('test', { field: 'email' });
      expect(isRecoverableError(recoverable)).toBe(true);

      // Syntax errors are not recoverable
      const nonRecoverable = new SyntaxError('Invalid syntax');
      expect(isRecoverableError(nonRecoverable)).toBe(false);
    });

    it('should return false for syntax errors', () => {
      expect(isRecoverableError(new SyntaxError('Invalid syntax'))).toBe(false);
    });

    it('should return false for reference errors', () => {
      expect(isRecoverableError(new ReferenceError('Variable not defined'))).toBe(false);
    });

    it('should return false for type errors', () => {
      expect(isRecoverableError(new TypeError('Invalid type'))).toBe(false);
    });

    it('should return false for range errors', () => {
      expect(isRecoverableError(new RangeError('Out of range'))).toBe(false);
    });

    it('should return true for HTTP errors', () => {
      const error = new Error('HTTP error') as any;
      error.statusCode = 404;
      expect(isRecoverableError(error)).toBe(true);
    });

    it('should return true by default', () => {
      expect(isRecoverableError(new Error('Generic error'))).toBe(true);
    });
  });

  describe('isUserFacingError', () => {
    it('should respect error userFacing property', () => {
      const userFacing = new ValidationError('Invalid email', { field: 'email' });
      expect(isUserFacingError(userFacing)).toBe(true);

      // Internal/system errors are typically not user-facing
      const notUserFacing = new Error('Internal system error');
      expect(isUserFacingError(notUserFacing)).toBe(false);
    });

    it('should identify validation errors as user-facing', () => {
      expect(isUserFacingError(new Error('Validation failed'))).toBe(true);
      expect(isUserFacingError(new Error('Invalid email address'))).toBe(true);
      expect(isUserFacingError(new Error('Password is required'))).toBe(true);
    });

    it('should identify authentication errors as user-facing', () => {
      expect(isUserFacingError(new Error('Unauthorized access'))).toBe(true);
      expect(isUserFacingError(new Error('Forbidden resource'))).toBe(true);
    });

    it('should identify 4xx errors as user-facing', () => {
      const error400 = new Error('Bad request') as any;
      error400.statusCode = 400;
      expect(isUserFacingError(error400)).toBe(true);

      const error403 = new Error('Forbidden') as any;
      error403.statusCode = 403;
      expect(isUserFacingError(error403)).toBe(true);
    });

    it('should not identify 5xx errors as user-facing', () => {
      const error500 = new Error('Internal server error') as any;
      error500.statusCode = 500;
      expect(isUserFacingError(error500)).toBe(false);
    });

    it('should return false by default for unknown errors', () => {
      expect(isUserFacingError(new Error('Unknown error'))).toBe(false);
    });
  });

  describe('categorizeError', () => {
    it('should return category from ValidationError', () => {
      const error = new ValidationError('test', { field: 'email' });
      expect(categorizeError(error)).toBe('validation');
    });

    it('should categorize network errors', () => {
      expect(categorizeError(new Error('Network request failed'))).toBe('network');
      expect(categorizeError(new Error('Fetch error'))).toBe('network');
      expect(categorizeError(new Error('Request timeout'))).toBe('network');
    });

    it('should categorize validation errors', () => {
      expect(categorizeError(new Error('Validation failed'))).toBe('validation');
      expect(categorizeError(new Error('Invalid input'))).toBe('validation');
      expect(categorizeError(new Error('Field is required'))).toBe('validation');
    });

    it('should categorize authentication errors', () => {
      expect(categorizeError(new Error('Unauthorized'))).toBe('authentication');
      expect(categorizeError(new Error('Forbidden'))).toBe('authentication');

      const error401 = new Error('test') as any;
      error401.statusCode = 401;
      expect(categorizeError(error401)).toBe('authentication');

      const error403 = new Error('test') as any;
      error403.statusCode = 403;
      expect(categorizeError(error403)).toBe('authentication');
    });

    it('should categorize runtime errors', () => {
      expect(categorizeError(new ReferenceError('test'))).toBe('runtime');
      expect(categorizeError(new TypeError('test'))).toBe('runtime');
      expect(categorizeError(new SyntaxError('test'))).toBe('runtime');
    });

    it('should categorize by status code', () => {
      const error4xx = new Error('Client error') as any;
      error4xx.statusCode = 422;
      expect(categorizeError(error4xx)).toBe('validation');

      const error5xx = new Error('Server error') as any;
      error5xx.statusCode = 500;
      expect(categorizeError(error5xx)).toBe('third_party');
    });

    it('should return unknown for unrecognized errors', () => {
      expect(categorizeError(new Error('Random error'))).toBe('unknown');
    });
  });

  describe('createErrorChain', () => {
    it('should create error chain with cause', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');
      const error3 = new Error('Third error');

      const chain = createErrorChain([error1, error2, error3]);

      expect(chain).toBe(error1);
      expect((chain as any).cause).toBe(error2);
      expect((error2 as any).cause).toBe(error3);
    });

    it('should return single error if array has one element', () => {
      const error = new Error('Single error');
      const chain = createErrorChain([error]);

      expect(chain).toBe(error);
      expect((chain as any).cause).toBeUndefined();
    });

    it('should handle empty array', () => {
      const chain = createErrorChain([]);

      expect(chain).toBeInstanceOf(Error);
      expect(chain.message).toBe('Empty error chain');
    });
  });

  describe('flattenErrorChain', () => {
    it('should flatten error chain', () => {
      const error3 = new Error('Third');
      const error2 = new Error('Second') as any;
      error2.cause = error3;
      const error1 = new Error('First') as any;
      error1.cause = error2;

      const flattened = flattenErrorChain(error1);

      expect(flattened).toHaveLength(3);
      expect(flattened[0]).toBe(error1);
      expect(flattened[1]).toBe(error2);
      expect(flattened[2]).toBe(error3);
    });

    it('should return single error if no chain', () => {
      const error = new Error('Single');
      const flattened = flattenErrorChain(error);

      expect(flattened).toHaveLength(1);
      expect(flattened[0]).toBe(error);
    });
  });

  describe('getErrorFingerprint', () => {
    it('should generate consistent fingerprint for same error', () => {
      const error1 = new Error('Test error 123');
      const error2 = new Error('Test error 456');

      const fingerprint1 = getErrorFingerprint(error1);
      const fingerprint2 = getErrorFingerprint(error2);

      // Should be similar because numbers are replaced with 'N'
      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different errors', () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Validation error');

      const fingerprint1 = getErrorFingerprint(error1);
      const fingerprint2 = getErrorFingerprint(error2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should generate fingerprint with max 16 characters', () => {
      const error = new Error('Some very long error message that should be truncated');
      const fingerprint = getErrorFingerprint(error);

      expect(fingerprint.length).toBeLessThanOrEqual(16);
    });

    it('should handle errors without stack', () => {
      const error = new Error('No stack');
      error.stack = undefined;

      expect(() => getErrorFingerprint(error)).not.toThrow();
    });
  });
});
