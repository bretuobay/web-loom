import { describe, it, expect } from 'vitest';
import { PluralRules } from '../formatters/plural';

describe('PluralRules', () => {
  const pr = new PluralRules();
  const locale = 'en-US';

  it('selects plural rule', () => {
    expect(pr.select(1, locale)).toBe('one');
    expect(pr.select(2, locale)).toBe('other');
  });

  it('formats using ICU forms', () => {
    const forms = { one: 'item', other: 'items' };
    expect(pr.format(1, locale, forms)).toBe('item');
    expect(pr.format(2, locale, forms)).toBe('items');
  });
});
