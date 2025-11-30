import type { ScaleResult } from './types';

/**
 * Generates a modular scale centered around the base font size.
 * Includes smaller and larger steps to keep scales harmonious.
 */
export function generateModularScale(baseSize: number, ratio: number, steps: number): ScaleResult {
  if (baseSize <= 0) {
    throw new Error('Base size must be greater than zero.');
  }
  if (ratio <= 1) {
    throw new Error('Ratio must be greater than 1 to produce a meaningful scale.');
  }
  if (steps < 1) {
    throw new Error('Steps must be at least 1.');
  }

  const values: number[] = [];
  const map: Record<number, number> = {};

  for (let step = -steps; step <= steps; step += 1) {
    const value = parseFloat((baseSize * Math.pow(ratio, step)).toFixed(4));
    values.push(value);
    map[step] = value;
  }

  return {
    baseSize,
    ratio,
    steps,
    values,
    map,
  };
}
