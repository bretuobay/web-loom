import type { NativeTypographyOptions, ReactNativeTypography } from '../types';

const DEFAULT_NATIVE_OPTIONS: Required<NativeTypographyOptions> = {
  baseFontSize: 16,
  scaleFactor: 1,
  platform: 'ios',
};

export function scaleFontForDevice(fontSize: number, pixelRatio: number): number {
  if (fontSize <= 0) {
    throw new Error('scaleFontForDevice: fontSize must be positive.');
  }
  if (pixelRatio <= 0) {
    throw new Error('scaleFontForDevice: pixelRatio must be positive.');
  }
  const scaled = fontSize * (pixelRatio / 2);
  return Math.round(scaled * 100) / 100;
}

export function createReactNativeTypography(
  fontFamily: string,
  options: NativeTypographyOptions = {},
): ReactNativeTypography {
  if (!fontFamily) {
    throw new Error('createReactNativeTypography: fontFamily is required.');
  }

  const config = { ...DEFAULT_NATIVE_OPTIONS, ...options };
  const fontSize = config.baseFontSize * (config.scaleFactor ?? 1);
  const lineHeight = fontSize * 1.35;
  const letterSpacing = config.platform === 'android' ? 0.2 : 0;

  return {
    fontFamily,
    fontSize: Math.round(fontSize * 100) / 100,
    lineHeight: Math.round(lineHeight * 100) / 100,
    letterSpacing,
  };
}

export function createNativeTypographyPreset(
  preset: 'heading' | 'body' | 'caption',
  fontFamily: string,
  options: NativeTypographyOptions = {},
): ReactNativeTypography {
  const multipliers: Record<typeof preset, number> = {
    heading: 1.4,
    body: 1,
    caption: 0.85,
  } as const;

  const config = { ...DEFAULT_NATIVE_OPTIONS, ...options };
  return createReactNativeTypography(fontFamily, {
    ...config,
    baseFontSize: config.baseFontSize * multipliers[preset],
  });
}
