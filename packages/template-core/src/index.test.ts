import { describe, expect, it } from 'vitest';
import { VERSION } from './index.js';

describe('@web-loom/template-core', () => {
  it('exposes a package version', () => {
    expect(VERSION).toBe('0.8.0');
  });
});
