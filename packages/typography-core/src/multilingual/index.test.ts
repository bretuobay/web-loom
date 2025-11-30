import { describe, expect, it } from 'vitest';
import { adaptTypographyForLocale, applyRTLSupport, isRTLLocale } from './index';

describe('multilingual utilities', () => {
  it('detects rtl locales', () => {
    expect(isRTLLocale('ar-EG')).toBe(true);
    expect(isRTLLocale('en-US')).toBe(false);
  });

  it('applies rtl direction to elements', () => {
    const element = document.createElement('div');
    applyRTLSupport(element, 'ar-EG');
    expect(element.getAttribute('dir')).toBe('rtl');
  });

  it('adapts typography guidance for locales', () => {
    const adjustments = adaptTypographyForLocale('ja-JP');
    expect(adjustments.fontFamily).toContain('Noto Sans');
    expect(adjustments.direction).toBe('ltr');
  });
});
