import type { AccessibilityAdjustments, VisionContext } from './types';

const SEVERITY_MULTIPLIERS: Record<VisionContext['severity'], number> = {
  mild: 1.15,
  moderate: 1.35,
  severe: 1.6,
};

export function adjustForLowVision(fontSize: number, context: VisionContext): AccessibilityAdjustments {
  if (fontSize <= 0) {
    throw new Error('fontSize must be greater than zero.');
  }

  const multiplier = SEVERITY_MULTIPLIERS[context.severity];
  const adjustedSize = fontSize * multiplier;
  const recommendedContrast = context.prefersHighContrast ? 7 : 4.5;
  const zoomLevel = context.zoomLevel ?? multiplier * 100;

  const notes = [`Increase base font size by ${Math.round((multiplier - 1) * 100)}%.`];
  if (context.prefersHighContrast) {
    notes.push('Use color pairs that meet WCAG AAA where possible.');
  }

  return {
    fontSize: `${adjustedSize.toFixed(1)}px`,
    recommendedContrastRatio: recommendedContrast,
    zoomLevel,
    notes,
  };
}
