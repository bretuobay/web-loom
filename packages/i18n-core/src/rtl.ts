import type { Locale } from './types';

// List of RTL language codes (ISO 639-1)
const RTL_LANGS = [
  'ar', // Arabic
  'dv', // Divehi
  'fa', // Persian
  'ha', // Hausa
  'he', // Hebrew
  'ks', // Kashmiri
  'ku', // Kurdish
  'ps', // Pashto
  'ur', // Urdu
  'yi', // Yiddish
];

// Check if locale is RTL
export function isRTL(locale: Locale): boolean {
  const lang = locale.split('-')[0].toLowerCase();
  return RTL_LANGS.includes(lang);
}

// Get text direction for locale
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
