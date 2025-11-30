import type { TextMeasurementOptions, TextMeasurementResult } from './types';
import { calculateOptimalLineHeight } from './line-height';

const FONT_WIDTH_FACTORS: Array<{ pattern: RegExp; factor: number }> = [
  { pattern: /inter|system-ui|sans-serif|helvetica|arial/i, factor: 0.52 },
  { pattern: /roboto|open sans|lato/i, factor: 0.5 },
  { pattern: /poppins|mulish|nunito/i, factor: 0.48 },
  { pattern: /georgia|times|serif/i, factor: 0.45 },
  { pattern: /monospace|menlo|fira code|jetbrains/i, factor: 0.62 },
];

function resolveWidthFactor(fontFamily?: string): number {
  if (!fontFamily) {
    return 0.52;
  }

  for (const entry of FONT_WIDTH_FACTORS) {
    if (entry.pattern.test(fontFamily)) {
      return entry.factor;
    }
  }

  return 0.52;
}

export function calculateCharactersPerLine(fontSize: number, lineWidth: number, fontFamily?: string): number {
  if (fontSize <= 0) {
    throw new Error('fontSize must be greater than zero.');
  }
  if (lineWidth <= 0) {
    throw new Error('lineWidth must be greater than zero.');
  }

  const widthFactor = resolveWidthFactor(fontFamily);
  const rawCharacters = lineWidth / (fontSize * widthFactor);
  return Math.max(20, Math.round(rawCharacters));
}

export function measureText(
  text: string,
  fontSize: number,
  fontFamily: string,
  options: TextMeasurementOptions = {},
): TextMeasurementResult {
  if (fontSize <= 0) {
    throw new Error('fontSize must be greater than zero.');
  }

  const safeText = text ?? '';
  const lineHeightRatio = options.lineHeight ?? calculateOptimalLineHeight(fontSize, 'body');
  const lineHeightPx = lineHeightRatio * fontSize;

  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(1, 1)
      : null;

  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const weight = options.fontWeight ? `${options.fontWeight} ` : '';
      ctx.font = `${weight}${fontSize}px ${fontFamily}`.trim();
      const metrics = ctx.measureText(safeText);
      const letterSpacing = options.letterSpacing ?? 0;
      const spacingAdjustment = letterSpacing * Math.max(safeText.length - 1, 0);
      const width = metrics.width + spacingAdjustment;
      const ascent = metrics.actualBoundingBoxAscent ?? lineHeightPx * 0.8;
      const baseline = ascent;

      return {
        width: parseFloat(width.toFixed(2)),
        height: parseFloat(lineHeightPx.toFixed(2)),
        baseline: parseFloat(baseline.toFixed(2)),
      };
    }
  }

  // Fallback heuristic measurement
  const widthFactor = resolveWidthFactor(fontFamily);
  const estimatedWidth = safeText.length * fontSize * widthFactor;
  return {
    width: parseFloat(estimatedWidth.toFixed(2)),
    height: parseFloat(lineHeightPx.toFixed(2)),
    baseline: parseFloat((lineHeightPx * 0.8).toFixed(2)),
  };
}
