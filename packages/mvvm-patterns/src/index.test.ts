import { expect, it } from 'vitest';
import { VERSION } from './index';

it('exposes the package version', () => {
  expect(VERSION).toBe('0.0.1');
});
