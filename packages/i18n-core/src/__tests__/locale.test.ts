import { describe, it, expect, vi } from 'vitest';
import { detectBrowserLocale, getUserLocales, isValidLocale, parseLocale, normalizeLocale } from '../locale';

globalThis.navigator = {
  language: 'en-US',
  languages: ['en-US', 'fr-FR'],
} as any;

describe('locale.ts', () => {
  it('detectBrowserLocale returns normalized browser locale', () => {
    expect(detectBrowserLocale()).toBe('en-US');
  });

  it('getUserLocales returns all preferred locales', () => {
    expect(getUserLocales()).toEqual(['en-US', 'fr-FR']);
  });

  it('isValidLocale checks against supported locales', () => {
    expect(isValidLocale('en-US', ['en-US', 'fr-FR'])).toBe(true);
    expect(isValidLocale('es-ES', ['en-US', 'fr-FR'])).toBe(false);
  });

  it('parseLocale extracts language, region, script', () => {
    expect(parseLocale('en-US')).toEqual({ language: 'en', region: 'US', script: undefined });
    expect(parseLocale('zh-Hans-CN')).toEqual({ language: 'zh', script: 'Hans', region: 'CN' });
    expect(parseLocale('ar')).toEqual({ language: 'ar', region: undefined, script: undefined });
  });

  it('normalizeLocale replaces underscores and formats case', () => {
    expect(normalizeLocale('en_US')).toBe('en-US');
    expect(normalizeLocale('fr_fr')).toBe('fr-FR');
    expect(normalizeLocale('zh_hans_cn')).toBe('zh-Hans-CN');
  });
});
