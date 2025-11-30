export interface DyslexiaConfig {
  baseFontSize?: number;
  maxFontSize?: number;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  preferredBackground?: string;
  preferredTextColor?: string;
}

export interface TypographyAdjustments {
  fontFamily: string;
  fontSize: string;
  lineHeight: number;
  letterSpacing: string;
  wordSpacing: string;
  backgroundColor?: string;
  textColor?: string;
  suggestions: string[];
}

export type VisionSeverity = 'mild' | 'moderate' | 'severe';

export interface VisionContext {
  severity: VisionSeverity;
  prefersHighContrast?: boolean;
  zoomLevel?: number;
}

export interface AccessibilityAdjustments {
  fontSize: string;
  recommendedContrastRatio: number;
  zoomLevel: number;
  notes: string[];
}

export interface AnimationConfig {
  name: string;
  duration: number;
  easing?: string;
}

export interface SafeAnimationConfig extends AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
}

export interface AccessibilityReport {
  fontSize: number;
  contrastRatio?: number;
  passesAA: boolean;
  warnings: string[];
}
