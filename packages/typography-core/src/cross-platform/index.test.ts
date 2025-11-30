import { describe, expect, it } from 'vitest';
import { createNativeTypographyPreset, createReactNativeTypography, scaleFontForDevice } from './index';

describe('cross platform typography', () => {
  it('scales font sizes based on device pixel ratio', () => {
    expect(scaleFontForDevice(16, 3)).toBeCloseTo(24);
  });

  it('creates React Native typography objects', () => {
    const preset = createReactNativeTypography('Inter', { baseFontSize: 18, platform: 'android' });
    expect(preset.fontSize).toBe(18);
    expect(preset.letterSpacing).toBeGreaterThan(0);
  });

  it('creates named presets for mobile', () => {
    const heading = createNativeTypographyPreset('heading', 'Inter', { baseFontSize: 16 });
    expect(heading.fontSize).toBeGreaterThan(16);
  });
});
