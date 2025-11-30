import type { FontSubsetOptions, FontSubsetPlan, FontUsageSnapshot } from './types';

const sanitizeText = (text: string, preserveCase: boolean): string => {
  const cleaned = text.normalize('NFKD');
  return preserveCase ? cleaned : cleaned.toLowerCase();
};

export function generateFontSubset(text: string, options: FontSubsetOptions = {}): FontSubsetPlan {
  const preserveCase = options.preserveCase ?? false;
  const processed = sanitizeText(`${text}${options.additionalCharacters ?? ''}`, preserveCase);
  const uniqueCharacters = Array.from(new Set(processed.replace(/\s+/g, '')));

  const unicodeRange = uniqueCharacters
    .map((char) => `U+${char.codePointAt(0)?.toString(16).toUpperCase()}`)
    .filter(Boolean)
    .join(', ');

  const estimatedSavings = parseFloat((Math.max(processed.length - uniqueCharacters.length, 0) * 0.25).toFixed(2));

  return {
    characters: uniqueCharacters.join(''),
    unicodeRange,
    uniqueGlyphs: uniqueCharacters.length,
    estimatedSavings,
    recommendedFormat: uniqueCharacters.length > 250 ? 'woff2' : 'woff',
  };
}

export function planFontSubsets(usages: FontUsageSnapshot[], options?: FontSubsetOptions): FontSubsetPlan[] {
  return usages.map((usage) => generateFontSubset(usage.text, options));
}

export function estimateFontTransferSavings(
  fullFileSizeKB: number,
  subsetGlyphCount: number,
  originalGlyphCount: number,
): number {
  if (fullFileSizeKB <= 0 || subsetGlyphCount <= 0 || originalGlyphCount <= 0) {
    return 0;
  }
  const ratio = subsetGlyphCount / originalGlyphCount;
  const estimatedSubsetSize = fullFileSizeKB * ratio;
  return parseFloat((fullFileSizeKB - estimatedSubsetSize).toFixed(2));
}
