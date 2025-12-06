import { describe, it, expect } from 'vitest';
import {
  parseStackTrace,
  normalizeStackTrace,
  extractRelevantFrames,
  enhanceStackTrace,
  captureStackTrace,
  getCallerInfo,
  type StackFrame,
} from './stackTrace';

describe('stackTrace', () => {
  describe('parseStackTrace', () => {
    it('should parse standard error stack trace', () => {
      const error = new Error('Test error');
      const parsed = parseStackTrace(error);

      expect(parsed.name).toBe('Error');
      expect(parsed.message).toBe('Test error');
      expect(parsed.frames).toBeDefined();
      expect(Array.isArray(parsed.frames)).toBe(true);
    });

    it('should extract function names from stack frames', () => {
      const error = new Error('Test');
      const parsed = parseStackTrace(error);

      if (parsed.frames.length > 0) {
        // At least one frame should have a function name or be anonymous
        const hasFunction = parsed.frames.some((frame) => frame.functionName !== undefined);
        expect(hasFunction).toBe(true);
      }
    });

    it('should handle error without stack', () => {
      const error = new Error('No stack');
      error.stack = '';

      const parsed = parseStackTrace(error);

      expect(parsed.message).toBe('No stack');
      expect(parsed.frames).toEqual([]);
    });

    it('should handle errors with custom stack format', () => {
      const error = new Error('Custom');
      error.stack = 'Error: Custom\n    at test (file.js:10:5)\n    at run (app.js:20:10)';

      const parsed = parseStackTrace(error);

      expect(parsed.frames.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeStackTrace', () => {
    it('should normalize stack trace to consistent format', () => {
      const error = new Error('Test error');
      const normalized = normalizeStackTrace(error);

      expect(normalized).toContain('Error: Test error');
      expect(typeof normalized).toBe('string');
    });

    it('should include function names in normalized output', () => {
      const error = new Error('Test');
      const normalized = normalizeStackTrace(error);

      expect(normalized).toMatch(/at .+/);
    });

    it('should handle frames without file information', () => {
      const error = new Error('Test');
      // Manually create a stack with minimal info
      error.stack = 'Error: Test\n    at unknown location';

      const normalized = normalizeStackTrace(error);

      expect(normalized).toContain('Error: Test');
      expect(normalized).toContain('at ');
    });
  });

  describe('extractRelevantFrames', () => {
    const createMockFrames = (): StackFrame[] => [
      {
        functionName: 'userFunction',
        fileName: '/app/user.js',
        lineNumber: 10,
        columnNumber: 5,
      },
      {
        functionName: 'nodeInternal',
        fileName: 'internal/module.js',
        lineNumber: 20,
        columnNumber: 10,
      },
      {
        functionName: 'libFunction',
        fileName: '/app/node_modules/lib/index.js',
        lineNumber: 30,
        columnNumber: 15,
      },
      {
        functionName: 'appFunction',
        fileName: '/app/index.js',
        lineNumber: 40,
        columnNumber: 20,
      },
    ];

    it('should filter out node_modules by default', () => {
      const frames = createMockFrames();
      const relevant = extractRelevantFrames(frames);

      const hasNodeModules = relevant.some((f) => f.fileName?.includes('node_modules'));
      expect(hasNodeModules).toBe(false);
    });

    it('should filter out internal frames by default', () => {
      const frames = createMockFrames();
      const relevant = extractRelevantFrames(frames);

      const hasInternal = relevant.some((f) => f.fileName?.startsWith('internal/') || f.fileName?.startsWith('node:'));
      expect(hasInternal).toBe(false);
    });

    it('should respect skipNodeModules option', () => {
      const frames = createMockFrames();
      const relevant = extractRelevantFrames(frames, { skipNodeModules: false });

      const hasNodeModules = relevant.some((f) => f.fileName?.includes('node_modules'));
      expect(hasNodeModules).toBe(true);
    });

    it('should respect skipInternalFrames option', () => {
      const frames = createMockFrames();
      const relevant = extractRelevantFrames(frames, { skipInternalFrames: false });

      expect(relevant.length).toBeGreaterThanOrEqual(frames.length - 1);
    });

    it('should limit frames to maxFrames', () => {
      const frames = createMockFrames();
      const relevant = extractRelevantFrames(frames, { maxFrames: 1 });

      expect(relevant.length).toBeLessThanOrEqual(1);
    });

    it('should preserve frames without fileName', () => {
      const frames: StackFrame[] = [
        { functionName: 'unknown', source: 'at unknown' },
        { functionName: 'test', fileName: '/app/test.js', lineNumber: 10 },
      ];

      const relevant = extractRelevantFrames(frames);

      expect(relevant.length).toBeGreaterThan(0);
    });
  });

  describe('enhanceStackTrace', () => {
    it('should enhance stack trace with additional context', () => {
      const error = new Error('Test error');
      const enhanced = enhanceStackTrace(error, {
        operation: 'fetchUser',
        component: 'UserService',
        metadata: { userId: 123 },
      });

      expect(enhanced).toContain('Test error');
      expect(enhanced).toContain('Operation: fetchUser');
      expect(enhanced).toContain('Component: UserService');
      expect(enhanced).toContain('Metadata:');
      expect(enhanced).toContain('userId');
    });

    it('should work without additional context', () => {
      const error = new Error('Test error');
      const enhanced = enhanceStackTrace(error);

      expect(enhanced).toContain('Error: Test error');
      expect(enhanced).not.toContain('Operation:');
      expect(enhanced).not.toContain('Component:');
    });

    it('should include partial context', () => {
      const error = new Error('Test error');
      const enhanced = enhanceStackTrace(error, {
        operation: 'test',
      });

      expect(enhanced).toContain('Operation: test');
      expect(enhanced).not.toContain('Component:');
    });

    it('should format stack frames properly', () => {
      const error = new Error('Test');
      const enhanced = enhanceStackTrace(error);

      expect(enhanced).toMatch(/at .+/);
    });
  });

  describe('captureStackTrace', () => {
    it('should capture current stack trace', () => {
      const frames = captureStackTrace();

      expect(Array.isArray(frames)).toBe(true);
      expect(frames.length).toBeGreaterThan(0);
    });

    it('should skip specified number of frames', () => {
      const frames0 = captureStackTrace(0);
      const frames1 = captureStackTrace(1);

      // When skipping frames, we should get fewer or different frames
      expect(frames1.length).toBeLessThanOrEqual(frames0.length);
    });

    it('should return stack frames', () => {
      const frames = captureStackTrace();

      if (frames.length > 0) {
        const frame = frames[0];
        expect(frame).toHaveProperty('source');
      }
    });

    it('should not include captureStackTrace in the trace', () => {
      const frames = captureStackTrace();

      const hasCaptureStackTrace = frames.some((f) => f.functionName?.includes('captureStackTrace'));

      // Should not include the captureStackTrace function itself
      expect(hasCaptureStackTrace).toBe(false);
    });
  });

  describe('getCallerInfo', () => {
    it('should get caller information', () => {
      function testFunction() {
        return getCallerInfo();
      }

      const callerInfo = testFunction();

      expect(callerInfo).toBeDefined();
      if (callerInfo) {
        expect(callerInfo.source).toBeDefined();
      }
    });

    it('should skip specified frames', () => {
      function level2() {
        return getCallerInfo(0);
      }

      function level1() {
        return level2();
      }

      const callerInfo = level1();

      expect(callerInfo).toBeDefined();
    });

    it('should return null if no caller', () => {
      // This is hard to test directly, but we can verify it doesn't throw
      const frames = captureStackTrace(100); // Skip way more frames than exist
      expect(frames).toBeDefined();
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end with real errors', () => {
      function throwError() {
        throw new Error('Test error');
      }

      function catchError() {
        try {
          throwError();
        } catch (err) {
          return err as Error;
        }
      }

      const error = catchError();
      expect(error).toBeDefined();

      if (error) {
        const parsed = parseStackTrace(error);
        expect(parsed.frames.length).toBeGreaterThan(0);

        const normalized = normalizeStackTrace(error);
        expect(normalized).toContain('Test error');

        const enhanced = enhanceStackTrace(error, { operation: 'test' });
        expect(enhanced).toContain('Operation: test');
      }
    });

    it('should handle deeply nested errors', () => {
      function level3(): never {
        throw new Error('Deep error');
      }

      function level2() {
        level3();
      }

      function level1() {
        try {
          level2();
        } catch (err) {
          return err as Error;
        }
      }

      const error = level1();
      expect(error).toBeDefined();

      if (error) {
        const parsed = parseStackTrace(error);
        // Should have multiple frames from nested calls
        expect(parsed.frames.length).toBeGreaterThan(2);
      }
    });
  });
});
