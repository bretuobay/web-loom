import type { ExperimentResults, TypographyExperiment, TypographyVariantConfig } from '../types';

export function createTypographyExperiment(name: string, variants: TypographyVariantConfig[]): TypographyExperiment {
  if (!name) {
    throw new Error('createTypographyExperiment: name is required.');
  }
  if (!variants.length) {
    throw new Error('createTypographyExperiment: at least one variant must be provided.');
  }

  const impressions: Record<string, number> = {};
  const conversions: Record<string, number> = {};

  variants.forEach((variant) => {
    impressions[variant.id] = 0;
    conversions[variant.id] = 0;
  });

  return {
    name,
    variants,
    impressions,
    conversions,
    createdAt: Date.now(),
  };
}

export function recordTypographyInteraction(
  experiment: TypographyExperiment,
  variantId: string,
  type: 'impression' | 'conversion',
): void {
  if (!experiment.impressions[variantId]) {
    experiment.impressions[variantId] = 0;
  }
  if (!experiment.conversions[variantId]) {
    experiment.conversions[variantId] = 0;
  }

  if (type === 'impression') {
    experiment.impressions[variantId] += 1;
  } else {
    experiment.conversions[variantId] += 1;
  }
}

export function getTypographyExperimentResults(experiment: TypographyExperiment): ExperimentResults[] {
  return experiment.variants.map((variant) => {
    const impressions = experiment.impressions[variant.id] ?? 0;
    const conversions = experiment.conversions[variant.id] ?? 0;
    const conversionRate = impressions === 0 ? 0 : conversions / impressions;
    return {
      variantId: variant.id,
      conversionRate: parseFloat(conversionRate.toFixed(4)),
      impressions,
      conversions,
    };
  });
}
