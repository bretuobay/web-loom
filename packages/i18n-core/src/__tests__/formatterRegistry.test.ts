import { describe, it, expect } from 'vitest';
import { FormatterRegistry } from '../formatters';

describe('FormatterRegistry', () => {
  it('initializes all formatters and sets locale', () => {
    const reg = new FormatterRegistry('en-US');
    expect(reg.number).toBeDefined();
    expect(reg.date).toBeDefined();
    expect(reg.list).toBeDefined();
    expect(reg.plural).toBeDefined();
    expect(reg.locale).toBe('en-US');
    reg.setLocale('fr-FR');
    expect(reg.locale).toBe('fr-FR');
  });

  it('provides locale-aware formatting helpers', () => {
    const reg = new FormatterRegistry('en-US');
    const enNumber = reg.formatNumber(1234.56, { minimumFractionDigits: 2 });
    reg.setLocale('de-DE');
    const deNumber = reg.formatNumber(1234.56, { minimumFractionDigits: 2 });
    expect(enNumber).not.toBe(deNumber);

    const list = reg.formatList(['one', 'two']);
    expect(typeof list).toBe('string');

    const relative = reg.formatRelative(Date.now() + 60_000);
    expect(typeof relative).toBe('string');

    const plural = reg.selectPlural(2);
    expect(typeof plural).toBe('string');
  });
});
