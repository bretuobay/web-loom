import { describe, it, expect } from 'vitest';
import { version } from './index';

describe('UI Core Package', () => {
  it('should export version', () => {
    expect(version).toBe('1.0.0');
  });
});
