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
});
