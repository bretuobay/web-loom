const GOLDEN_RATIO = 1.61803398875;

export function applyGoldenRatio(size: number, direction: 'up' | 'down' = 'up'): number {
  if (size <= 0) {
    throw new Error('size must be greater than zero.');
  }
  const factor = direction === 'up' ? GOLDEN_RATIO : 1 / GOLDEN_RATIO;
  return parseFloat((size * factor).toFixed(3));
}

export function generateGoldenScale(baseSize: number, steps: number): number[] {
  if (steps < 1) {
    throw new Error('steps must be at least 1.');
  }
  const scale: number[] = [];
  for (let i = -steps; i <= steps; i += 1) {
    const value = baseSize * Math.pow(GOLDEN_RATIO, i);
    scale.push(parseFloat(value.toFixed(3)));
  }
  return scale;
}

export function calculateOpticalSize(fontSize: number, viewingDistance: number, pixelDensity: number = 96): number {
  if (fontSize <= 0) {
    throw new Error('fontSize must be greater than zero.');
  }
  if (viewingDistance <= 0) {
    throw new Error('viewingDistance must be greater than zero.');
  }
  if (pixelDensity <= 0) {
    throw new Error('pixelDensity must be greater than zero.');
  }

  const distanceFactor = Math.min(Math.max(viewingDistance / 40, 0.75), 2);
  const densityFactor = Math.min(Math.max(96 / pixelDensity, 0.5), 1.5);
  const optimalSize = fontSize * distanceFactor * densityFactor;
  return parseFloat(optimalSize.toFixed(2));
}

export function createOpticalSizeRamp(baseSize: number) {
  return {
    mobile: calculateOpticalSize(baseSize, 35, 460),
    tablet: calculateOpticalSize(baseSize * 1.1, 45, 326),
    desktop: calculateOpticalSize(baseSize * 1.25, 60, 220),
  };
}
