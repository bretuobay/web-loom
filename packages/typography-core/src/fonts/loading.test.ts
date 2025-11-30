import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectFontFeatures, loadWebFont, optimizeFontLoading, preloadFonts, validateFontSupport } from './loading';

describe('font loading utilities', () => {
  let originalFontFace: typeof FontFace | undefined;

  beforeEach(() => {
    originalFontFace = (globalThis as any).FontFace;
    (globalThis as any).FontFace = undefined;
  });

  afterEach(() => {
    (globalThis as any).FontFace = originalFontFace;
    document.head.innerHTML = '';
  });

  it('preloads fonts by injecting link tags', () => {
    preloadFonts([{ href: '/fonts/test.woff2' }]);
    const link = document.head.querySelector('link[data-preload-font="/fonts/test.woff2"]');
    expect(link).not.toBeNull();
  });

  it('falls back to style injection when FontFace API is unavailable', async () => {
    const result = await loadWebFont({
      family: 'Fallback Font',
      sources: [{ url: '/fonts/fallback.woff2', format: 'woff2' }],
    });
    expect(result.status).toBe('queued');
    const style = document.head.querySelector('style[data-font-family="Fallback Font"]');
    expect(style).not.toBeNull();
  });

  it('provides strategy recommendations', () => {
    const strategy = optimizeFontLoading('critical');
    expect(strategy.preload).toBe(true);
    expect(strategy.fontDisplay).toBe('swap');
  });

  it('validates font support configuration', () => {
    const validation = validateFontSupport({ family: 'Inter', weights: ['400'], formats: ['woff2'] });
    expect(validation.valid).toBe(true);
  });

  it('detects font features without throwing', () => {
    const features = detectFontFeatures('Inter');
    expect(typeof features.supportsLigatures).toBe('boolean');
  });
});
