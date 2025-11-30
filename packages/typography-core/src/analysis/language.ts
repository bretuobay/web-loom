import type { LanguageInfo } from '../types';

interface KeywordExtractionOptions {
  minLength?: number;
  maxKeywords?: number;
}

const LANGUAGE_PROFILES: Record<string, RegExp[]> = {
  en: [/the/gi, /ing\b/gi, /tion/gi],
  es: [/que/gi, /ción/gi, /los/gi],
  fr: [/que/gi, /les/gi, /tion/gi, /eau/gi],
  de: [/der/gi, /und/gi, /die/gi],
  ar: [/\u0627/gi, /\u0644/gi, /\u0645/gi],
};

const RTL_LANGS = ['ar', 'fa', 'he', 'ur'];

export function detectLanguage(text: string): LanguageInfo {
  const sample = text.slice(0, 2000).toLowerCase();
  let topLanguage = 'unknown';
  let bestScore = 0;

  Object.entries(LANGUAGE_PROFILES).forEach(([lang, patterns]) => {
    const score = patterns.reduce((acc, pattern) => acc + (sample.match(pattern)?.length ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      topLanguage = lang;
    }
  });

  const script = detectScript(sample);
  const rtl = RTL_LANGS.includes(topLanguage) || script === 'arabic';

  return {
    language: topLanguage,
    confidence: Math.min(1, bestScore / 10),
    script,
    rtl,
  };
}

export function detectScript(text: string): string {
  if (/\p{Script=Arabic}/u.test(text)) {
    return 'arabic';
  }
  if (/\p{Script=Cyrillic}/u.test(text)) {
    return 'cyrillic';
  }
  if (/\p{Script=Han}/u.test(text)) {
    return 'cjk';
  }
  return 'latin';
}

export function extractKeywords(text: string, options: KeywordExtractionOptions = {}): string[] {
  const minLength = options.minLength ?? 4;
  const maxKeywords = options.maxKeywords ?? 8;

  const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
  const frequency: Record<string, number> = {};

  cleaned.split(/\s+/).forEach((word) => {
    if (word.length < minLength) return;
    frequency[word] = (frequency[word] ?? 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}
