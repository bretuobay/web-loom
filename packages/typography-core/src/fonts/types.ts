import type { ValidationResult } from '../core/types';

export interface WebFontSource {
  url: string;
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype' | 'embedded-opentype' | 'svg';
  weight?: string | number;
  style?: 'normal' | 'italic' | 'oblique';
}

export interface WebFontConfig {
  family: string;
  sources: WebFontSource[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface FontLoadResult {
  status: 'loaded' | 'queued' | 'failed';
  duration: number;
  fontFace?: FontFace;
  error?: Error;
}

export interface FontPreloadConfig {
  href: string;
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface FontFeatures {
  supportsVariable: boolean;
  supportsLigatures: boolean;
  supportsKerning: boolean;
}

export interface FontLoadingStrategy {
  strategy: 'critical' | 'progressive' | 'async';
  fontDisplay: 'swap' | 'fallback' | 'optional';
  preload: boolean;
  description: string;
}

export interface FontConfig {
  family: string;
  weights?: Array<string | number>;
  styles?: Array<'normal' | 'italic' | 'oblique'>;
  formats?: Array<WebFontSource['format']>;
}

export type FontValidationResult = ValidationResult;

export interface FontSubsetOptions {
  preserveCase?: boolean;
  additionalCharacters?: string;
}

export interface FontSubsetPlan {
  characters: string;
  unicodeRange: string;
  uniqueGlyphs: number;
  estimatedSavings: number;
  recommendedFormat: WebFontSource['format'];
}

export interface FontUsageSnapshot {
  text: string;
  weight?: string | number;
  languages?: string[];
}
