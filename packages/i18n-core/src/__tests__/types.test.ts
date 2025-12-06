import { describe, it, expect } from 'vitest';
import type { Locale, SupportedLocale, Translations, I18nConfig } from '../types';

describe('types.ts', () => {
  it('Locale is a string', () => {
    const locale: Locale = 'en-US';
    expect(typeof locale).toBe('string');
  });

  it('SupportedLocale structure', () => {
    const supported: SupportedLocale = {
      code: 'en-US',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
    };
    expect(supported.code).toBe('en-US');
    expect(supported.direction).toBe('ltr');
  });

  it('Translations can be nested', () => {
    const t: Translations = {
      hello: 'Hello',
      nested: { world: 'World' },
    };
    expect(typeof t.hello).toBe('string');
    expect(typeof t.nested).toBe('object');
  });

  it('I18nConfig is type safe', () => {
    const config: I18nConfig = {
      defaultLocale: 'en-US',
      supportedLocales: [{ code: 'en-US', name: 'English', nativeName: 'English', direction: 'ltr' }],
      fallbackLocale: 'en',
      loadTranslations: async (locale) => ({ hello: 'Hello' }),
    };
    expect(config.defaultLocale).toBe('en-US');
  });
});
