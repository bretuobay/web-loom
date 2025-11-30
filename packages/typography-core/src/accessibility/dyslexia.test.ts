import { describe, it, expect, vi } from 'vitest';
import { optimizeForDyslexia, adjustForLowVision, respectMotionPreferences, validateTextAccessibility } from './index';

describe('dyslexia utilities', () => {
  it('returns dyslexia-friendly adjustments', () => {
    const adjustments = optimizeForDyslexia({ baseFontSize: 18 });
    expect(adjustments.fontFamily).toContain('Lexend');
    expect(adjustments.fontSize).toMatch(/px$/);
    expect(adjustments.suggestions.length).toBeGreaterThan(0);
  });

  it('adjusts typography for low vision contexts', () => {
    const adjustments = adjustForLowVision(16, { severity: 'moderate', prefersHighContrast: true });
    expect(adjustments.fontSize).toMatch(/px$/);
    expect(adjustments.recommendedContrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('respects reduced motion preferences', () => {
    const matchMediaMock = vi.fn().mockReturnValue({ matches: true });
    (window as any).matchMedia = matchMediaMock;
    const animations = respectMotionPreferences([{ name: 'typewriter', duration: 800 }]);
    expect(animations[0].enabled).toBe(false);
  });

  it('validates accessibility against computed styles', () => {
    const element = document.createElement('div');
    element.style.fontSize = '18px';
    element.style.color = '#000000';
    element.style.backgroundColor = '#ffffff';
    document.body.appendChild(element);
    const report = validateTextAccessibility(element);
    expect(report.passesAA).toBe(true);
    document.body.removeChild(element);
  });
});
