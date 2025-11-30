import type { LocaleTypographyAdjustments } from '../types';

const RTL_LOCALES = ['ar', 'fa', 'he', 'ur'];

const localeFonts: Record<string, string> = {
  ar: "'Cairo', 'Amiri', system-ui",
  fa: "'Vazirmatn', 'IRANSans', system-ui",
  he: "'Assistant', 'Rubik', system-ui",
  ja: "'Noto Sans JP', 'Hiragino Sans', system-ui",
  ko: "'Noto Sans KR', 'Apple SD Gothic Neo', system-ui",
  zh: "'Noto Sans SC', 'PingFang SC', system-ui",
};

export function isRTLLocale(locale: string): boolean {
  const lang = locale.slice(0, 2).toLowerCase();
  return RTL_LOCALES.includes(lang);
}

export function applyRTLSupport(element: HTMLElement, locale: string): void {
  if (!element) {
    throw new Error('applyRTLSupport: element is required.');
  }

  if (isRTLLocale(locale)) {
    element.setAttribute('dir', 'rtl');
    element.classList.add('rtl');
  } else {
    element.setAttribute('dir', 'ltr');
    element.classList.remove('rtl');
  }
}

export function adaptTypographyForLocale(locale: string): LocaleTypographyAdjustments {
  const lang = locale.slice(0, 2).toLowerCase();
  const direction = isRTLLocale(locale) ? 'rtl' : 'ltr';
  const fontFamily = localeFonts[lang] ?? "'Inter', system-ui";

  const letterSpacing = direction === 'rtl' ? '0.04em' : '0';
  const lineHeight = direction === 'rtl' ? 1.8 : 1.6;
  const wordSpacing = direction === 'rtl' ? '0.12em' : '0.08em';

  return {
    locale,
    direction,
    fontFamily,
    letterSpacing,
    lineHeight,
    wordSpacing,
  };
}
