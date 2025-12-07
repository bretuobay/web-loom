import { describe, it, expect } from 'vitest';
import { isRTL, getTextDirection } from '../rtl';

describe('rtl.ts', () => {
  it('isRTL returns true for RTL languages', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he-IL')).toBe(true);
    expect(isRTL('fa-IR')).toBe(true);
  });

  it('isRTL returns false for LTR languages', () => {
    expect(isRTL('en-US')).toBe(false);
    expect(isRTL('fr')).toBe(false);
  });

  it('getTextDirection returns correct direction', () => {
    expect(getTextDirection('ar')).toBe('rtl');
    expect(getTextDirection('en-US')).toBe('ltr');
  });
});
