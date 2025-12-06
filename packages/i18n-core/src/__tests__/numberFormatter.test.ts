import { describe, it, expect } from 'vitest';
import { NumberFormatter } from '../formatters/number';

describe('NumberFormatter', () => {
  const nf = new NumberFormatter();
  const locale = 'en-US';

  it('formats numbers', () => {
    expect(nf.format(1234.56, locale)).toBe('1,234.56');
  });

  it('formats currency', () => {
    expect(nf.formatCurrency(12, locale, 'USD')).toMatch(/\$12(\.00)?/);
  });

  it('formats percent', () => {
    expect(nf.formatPercent(0.5, locale)).toBe('50%');
  });

  it('formats unit', () => {
    // Unit formatting may vary by browser, so just check for value and unit
    const result = nf.formatUnit(5, locale, 'kilometer');
    expect(result).toMatch(/5.*km/);
  });
});
