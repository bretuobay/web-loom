const clampPrecision = (value: number) => parseFloat(value.toFixed(4));

/**
 * Creates a responsive clamp() expression for font sizing.
 */
export function createFluidType(
  minSize: number,
  maxSize: number,
  minViewport: number,
  maxViewport: number,
): string {
  if (minSize <= 0 || maxSize <= 0) {
    throw new Error('Font sizes must be positive numbers.');
  }
  if (minSize >= maxSize) {
    throw new Error('minSize must be smaller than maxSize.');
  }
  if (minViewport <= 0 || maxViewport <= 0) {
    throw new Error('Viewport sizes must be positive numbers.');
  }
  if (minViewport >= maxViewport) {
    throw new Error('minViewport must be smaller than maxViewport.');
  }

  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const slopePercentage = slope * 100;
  const intercept = minSize - slope * minViewport;

  const min = `${clampPrecision(minSize)}px`;
  const preferred = `${clampPrecision(intercept)}px + ${clampPrecision(slopePercentage)}vw`;
  const max = `${clampPrecision(maxSize)}px`;

  return `clamp(${min}, ${preferred}, ${max})`;
}
