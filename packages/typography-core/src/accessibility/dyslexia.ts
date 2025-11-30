import type { DyslexiaConfig, TypographyAdjustments } from './types';

const DEFAULT_DYSLEXIA_FONT = "'Lexend', 'OpenDyslexic', 'Atkinson Hyperlegible', system-ui, sans-serif";

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function optimizeForDyslexia(config: DyslexiaConfig = {}): TypographyAdjustments {
  const baseSize = clampValue(config.baseFontSize ?? 16, 16, 22);
  const maxSize = clampValue(config.maxFontSize ?? baseSize * 1.25, baseSize, 28);
  const fontFamily = config.fontFamily ?? DEFAULT_DYSLEXIA_FONT;
  const letterSpacing = clampValue(config.letterSpacing ?? 0.08, 0.05, 0.15);
  const lineHeight = clampValue(config.lineHeight ?? 1.6, 1.4, 1.8);

  const suggestions: string[] = [
    'Use sentence case and avoid all caps.',
    'Provide generous spacing between paragraphs.',
    'Keep line length between 45 and 75 characters.',
  ];

  if (config.preferredBackground && config.preferredTextColor) {
    suggestions.push('Verify contrast ratio is at least 7:1 for dyslexia-friendly themes.');
  }

  return {
    fontFamily,
    fontSize: `${maxSize}px`,
    lineHeight,
    letterSpacing: `${letterSpacing.toFixed(2)}em`,
    wordSpacing: '0.16em',
    backgroundColor: config.preferredBackground,
    textColor: config.preferredTextColor,
    suggestions,
  };
}
