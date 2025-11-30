/**
 * Interface for brand colors.
 */
export interface BrandColors {
  primary: string;
  secondary: string;
  accent?: string;
}

/**
 * Interface for the overall theme configuration.
 */
export interface ThemeConfig {
  fontSize: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  color: {
    textDark: string;
    textLight: string;
    background: string;
    surface: string;
  };
  brandColors: BrandColors;
  typography?: {
    fontFamily?: string;
    fontWeights?: { [key: string]: number };
    lineHeights?: { [key: string]: number };
    letterSpacing?: { [key: string]: string };
  };
}

/**
 * Interface for animation options.
 */
// types.ts - Animation options interface
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused';

  // Text-specific options
  speed?: number;
  pauseOnHover?: boolean;
  onComplete?: () => void;
  onStart?: () => void;

  // Typewriter specific
  cursor?: boolean;
  cursorChar?: string;
  cursorBlink?: boolean;

  // Fade/slide specific
  from?: 'top' | 'bottom' | 'left' | 'right';
  distance?: string;

  // Character animation specific
  stagger?: number;
  randomDelay?: boolean;
}

export interface AnimationController {
  play(): void;
  pause(): void;
  reverse(): void;
  cancel(): void;
  finish(): void;
  readonly finished: Promise<Animation>;
}

export interface MorphOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  stagger?: number;
  onComplete?: () => void;
}

export interface SpeedReadingOptions {
  wordsPerMinute?: number;
  chunkSize?: number;
  autoStart?: boolean;
  target?: HTMLElement | null;
  onWord?: (chunk: string, index: number) => void;
  onComplete?: () => void;
}

export interface SpeedReadingController {
  start(): void;
  pause(): void;
  stop(): void;
  isRunning(): boolean;
  setWordsPerMinute(wpm: number): void;
}

export interface VariationKeyframes {
  settings: Record<string, number>;
  duration?: number;
  easing?: string;
}

export interface VariableFontAnimationOptions {
  duration?: number;
  easing?: string;
  iterations?: number;
  direction?: AnimationOptions['direction'];
}

export interface GuidedReadingOptions {
  sentences?: string[];
  interval?: number;
  highlightClass?: string;
  loop?: boolean;
}

export interface GuidedReadingController {
  start(): void;
  pause(): void;
  stop(): void;
  next(): void;
  previous(): void;
  isActive(): boolean;
}

export interface FocusAssistOptions {
  highlightColor?: string;
  opacity?: number;
  size?: number;
}

export interface FocusAssistController {
  enable(): void;
  disable(): void;
  destroy(): void;
  isEnabled(): boolean;
}

export interface LanguageInfo {
  language: string;
  confidence: number;
  script: string;
  rtl: boolean;
}

export interface LocaleTypographyAdjustments {
  locale: string;
  direction: 'ltr' | 'rtl';
  fontFamily: string;
  letterSpacing: string;
  lineHeight: number;
  wordSpacing: string;
}

export interface ThreeDEffectOptions {
  depth?: number;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  highlightColor?: string;
  shadowColor?: string;
}

export interface ThreeDEffectController {
  update(options: Partial<ThreeDEffectOptions>): void;
  destroy(): void;
}

export interface FontPairingSuggestion {
  primary: string;
  secondary: string;
  contrast: 'high' | 'medium' | 'low';
  remarks: string;
}

export interface TypographyRecommendation {
  fontPairings: FontPairingSuggestion[];
  optimalLineHeight: number;
  targetFontSize: number;
  notes: string[];
}

export interface TypographyVariantConfig {
  id: string;
  label: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface TypographyExperiment {
  name: string;
  variants: TypographyVariantConfig[];
  impressions: Record<string, number>;
  conversions: Record<string, number>;
  createdAt: number;
}

export interface ExperimentResults {
  variantId: string;
  conversionRate: number;
  impressions: number;
  conversions: number;
}

export interface NativeTypographyOptions {
  baseFontSize?: number;
  scaleFactor?: number;
  platform?: 'ios' | 'android';
}

export interface ReactNativeTypography {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}
