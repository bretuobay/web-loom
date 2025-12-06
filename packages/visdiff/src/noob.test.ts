import { expect } from 'vitest';
import { NOOB_STRING, NOOB_NUMBER } from './noob';
describe('Noob Constants', () => {
  it('should have correct NOOB_STRING value', () => {
    expect(NOOB_STRING).toBe('noob');
  });

  it('should have correct NOOB_NUMBER value', () => {
    expect(NOOB_NUMBER).toBe(0);
  });
});
