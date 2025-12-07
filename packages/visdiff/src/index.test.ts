/**
 * Basic setup verification test
 */

import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

describe('visdiff setup', () => {
  it('should export version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
