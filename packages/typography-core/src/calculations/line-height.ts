import type { VerticalRhythmMap } from './types';

const CONTEXT_MULTIPLIERS: Record<'body' | 'heading' | 'caption', number> = {
  body: 1.6,
  heading: 1.3,
  caption: 1.4,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calculateOptimalLineHeight(
  fontSize: number,
  context: 'body' | 'heading' | 'caption' = 'body',
): number {
  if (fontSize <= 0) {
    throw new Error('fontSize must be greater than zero.');
  }

  const baseMultiplier = CONTEXT_MULTIPLIERS[context];
  const sizeAdjustment = fontSize <= 16 ? 0.1 : fontSize >= 28 ? -0.15 : -0.05;
  const computed = baseMultiplier + sizeAdjustment;
  return parseFloat(clamp(computed, 1.2, 2).toFixed(2));
}

export function generateVerticalRhythm(baseLineHeight: number, scale: number[]): VerticalRhythmMap {
  if (baseLineHeight <= 0) {
    throw new Error('baseLineHeight must be positive.');
  }
  if (!Array.isArray(scale) || scale.length === 0) {
    throw new Error('scale must contain at least one multiplier.');
  }

  const multiples = Array.from(new Set(scale)).sort((a, b) => a - b);
  const rhythm = multiples.map((multiplier) => parseFloat((baseLineHeight * multiplier).toFixed(3)));
  const tokens = rhythm.reduce<Record<string, string>>((acc, value, index) => {
    const key = `step_${multiples[index]}`;
    acc[key] = `${value}px`;
    return acc;
  }, {});

  return {
    baseLineHeight,
    multiples,
    rhythm,
    tokens,
  };
}
