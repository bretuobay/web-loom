import type {
  FontConfig,
  FontFeatures,
  FontLoadResult,
  FontLoadingStrategy,
  FontPreloadConfig,
  WebFontConfig,
} from './types';
import type { ValidationResult } from '../core/types';

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

const toError = (value: unknown): Error => {
  return value instanceof Error ? value : new Error(typeof value === 'string' ? value : 'Unknown font loading error');
};

const injectFontFaceStyles = (config: WebFontConfig) => {
  if (typeof document === 'undefined') {
    return;
  }

  const style = document.createElement('style');
  style.setAttribute('data-font-family', config.family);
  const sources = config.sources
    .map((source) => {
      const format = source.format ? ` format('${source.format}')` : '';
      return `url('${source.url}')${format}`;
    })
    .join(', ');

  style.textContent = `@font-face { font-family: '${config.family}'; src: ${sources}; font-display: ${config.display ?? 'swap'}; }`;
  document.head.appendChild(style);
};

export async function loadWebFont(config: WebFontConfig): Promise<FontLoadResult> {
  if (!config.family || config.sources.length === 0) {
    return {
      status: 'failed',
      duration: 0,
      error: new Error('A font family and at least one source are required.'),
    };
  }

  const start = now();

  if (typeof document === 'undefined') {
    return {
      status: 'failed',
      duration: now() - start,
      error: new Error('Font loading requires a document context.'),
    };
  }

  if ('FontFace' in globalThis) {
    try {
      const source = config.sources[0];
      const descriptors: FontFaceDescriptors = {
        style: source.style ?? 'normal',
        weight: String(source.weight ?? '400'),
        display: config.display ?? 'swap',
      };
      const fontFace = new FontFace(
        config.family,
        `url(${source.url})${source.format ? ` format('${source.format}')` : ''}`,
        descriptors,
      );
      await fontFace.load();
      document.fonts?.add(fontFace);
      return {
        status: 'loaded',
        duration: now() - start,
        fontFace,
      };
    } catch (error) {
      return {
        status: 'failed',
        duration: now() - start,
        error: toError(error),
      };
    }
  }

  injectFontFaceStyles(config);
  return {
    status: 'queued',
    duration: now() - start,
  };
}

export function preloadFonts(fonts: FontPreloadConfig[]): void {
  if (typeof document === 'undefined') {
    return;
  }

  fonts.forEach((font) => {
    if (document.head.querySelector(`link[data-preload-font="${font.href}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = font.href;
    link.type = font.type ?? 'font/woff2';
    link.crossOrigin = font.crossOrigin ?? 'anonymous';
    link.setAttribute('data-preload-font', font.href);
    document.head.appendChild(link);
  });
}

export function detectFontFeatures(_fontFamily: string): FontFeatures {
  const supportsCSS = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';

  return {
    supportsVariable: supportsCSS ? CSS.supports('font-variation-settings', '"wght" 400') : false,
    supportsLigatures: supportsCSS ? CSS.supports('font-feature-settings', '"liga" 1') : false,
    supportsKerning: supportsCSS ? CSS.supports('font-kerning', 'normal') : false,
  };
}

export function optimizeFontLoading(strategy: 'critical' | 'progressive' | 'async'): FontLoadingStrategy {
  switch (strategy) {
    case 'critical':
      return {
        strategy,
        fontDisplay: 'swap',
        preload: true,
        description: 'Preload fonts eagerly and use swap to avoid invisible text.',
      };
    case 'progressive':
      return {
        strategy,
        fontDisplay: 'fallback',
        preload: false,
        description: 'Load fonts lazily but keep fallback text visible.',
      };
    case 'async':
    default:
      return {
        strategy: 'async',
        fontDisplay: 'optional',
        preload: false,
        description: 'Defer font loading for low-priority text.',
      };
  }
}

export function validateFontSupport(config: FontConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.family) {
    errors.push('Font family is required.');
  }

  if (config.weights) {
    config.weights.forEach((weight) => {
      if (Number.isNaN(Number(weight))) {
        warnings.push(`Font weight "${weight}" is not numeric.`);
      }
    });
  }

  if (!config.formats || config.formats.length === 0) {
    warnings.push('No font formats specified. Provide at least one to ensure browser support.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
