import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCsrfInterceptor, getCsrfToken, setCsrfToken } from './csrf';
import type { RequestConfig } from './types';

// Mock document for testing
const mockDocument = {
  querySelector: vi.fn(),
  createElement: vi.fn(),
  head: {
    appendChild: vi.fn(),
  },
  cookie: '',
};

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Mocking global document for testing
    global.document = mockDocument;
  });

  afterEach(() => {
    // @ts-expect-error - Cleaning up mocked document
    delete global.document;
  });

  describe('createCsrfInterceptor', () => {
    it('should add CSRF token to POST requests', () => {
      const metaTag = {
        getAttribute: vi.fn().mockReturnValue('csrf-token-123'),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      const interceptor = createCsrfInterceptor();
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        headers: {},
      };

      const result = interceptor(config);

      expect(result.headers).toHaveProperty('X-CSRF-Token', 'csrf-token-123');
    });

    it('should add CSRF token to PUT requests', () => {
      const metaTag = {
        getAttribute: vi.fn().mockReturnValue('csrf-token-123'),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      const interceptor = createCsrfInterceptor();
      const config: RequestConfig = {
        method: 'PUT',
        url: '/api/users/1',
        headers: {},
      };

      const result = interceptor(config);

      expect(result.headers).toHaveProperty('X-CSRF-Token', 'csrf-token-123');
    });

    it('should NOT add CSRF token to GET requests', () => {
      const interceptor = createCsrfInterceptor();
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        headers: {},
      };

      const result = interceptor(config);

      expect(result.headers).not.toHaveProperty('X-CSRF-Token');
    });

    it('should warn if token is missing', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockDocument.querySelector.mockReturnValue(null);

      const interceptor = createCsrfInterceptor();
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        headers: {},
      };

      interceptor(config);

      expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('CSRF token not found'));

      consoleWarn.mockRestore();
    });

    it('should not warn if warnOnMissing is false', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockDocument.querySelector.mockReturnValue(null);

      const interceptor = createCsrfInterceptor({ warnOnMissing: false });
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        headers: {},
      };

      interceptor(config);

      expect(consoleWarn).not.toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    it('should use custom header name', () => {
      const metaTag = {
        getAttribute: vi.fn().mockReturnValue('csrf-token-123'),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      const interceptor = createCsrfInterceptor({ headerName: 'X-Custom-CSRF' });
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        headers: {},
      };

      const result = interceptor(config);

      expect(result.headers).toHaveProperty('X-Custom-CSRF', 'csrf-token-123');
    });

    it('should use custom token selector', () => {
      const metaTag = {
        getAttribute: vi.fn().mockReturnValue('custom-token'),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      const interceptor = createCsrfInterceptor({
        tokenSelector: 'meta[name="custom-token"]',
      });
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        headers: {},
      };

      interceptor(config);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="custom-token"]');
    });
  });

  describe('getCsrfToken', () => {
    it('should get token from meta tag', () => {
      const metaTag = {
        getAttribute: vi.fn().mockReturnValue('csrf-token-123'),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      const token = getCsrfToken();

      expect(token).toBe('csrf-token-123');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="csrf-token"]');
    });

    it('should return null if meta tag not found', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const token = getCsrfToken();

      expect(token).toBeNull();
    });

    it('should use custom selector', () => {
      const metaTag = {
        getAttribute: vi.fn().mockReturnValue('custom-token'),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      getCsrfToken('meta[name="custom"]');

      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="custom"]');
    });
  });

  describe('setCsrfToken', () => {
    it('should update existing meta tag', () => {
      const metaTag = {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      };
      mockDocument.querySelector.mockReturnValue(metaTag);

      setCsrfToken('new-token');

      expect(metaTag.setAttribute).toHaveBeenCalledWith('content', 'new-token');
    });

    it('should create meta tag if it does not exist', () => {
      const newMetaTag = {
        setAttribute: vi.fn(),
      };
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.createElement.mockReturnValue(newMetaTag);

      setCsrfToken('new-token');

      expect(mockDocument.createElement).toHaveBeenCalledWith('meta');
      expect(newMetaTag.setAttribute).toHaveBeenCalledWith('name', 'csrf-token');
      expect(newMetaTag.setAttribute).toHaveBeenCalledWith('content', 'new-token');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(newMetaTag);
    });
  });
});
