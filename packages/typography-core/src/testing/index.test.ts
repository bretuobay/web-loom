import { describe, expect, it } from 'vitest';
import { createTypographyExperiment, getTypographyExperimentResults, recordTypographyInteraction } from './index';

describe('typography testing utilities', () => {
  it('tracks impressions and conversions per variant', () => {
    const experiment = createTypographyExperiment('Heading A/B', [
      { id: 'a', label: 'Sans Heading', fontFamily: 'Inter', fontSize: 32, lineHeight: 1.2 },
      { id: 'b', label: 'Serif Heading', fontFamily: 'Merriweather', fontSize: 34, lineHeight: 1.3 },
    ]);

    recordTypographyInteraction(experiment, 'a', 'impression');
    recordTypographyInteraction(experiment, 'a', 'conversion');
    recordTypographyInteraction(experiment, 'b', 'impression');

    const results = getTypographyExperimentResults(experiment);
    const variantA = results.find((result) => result.variantId === 'a');
    expect(variantA?.conversionRate).toBe(1);
    const variantB = results.find((result) => result.variantId === 'b');
    expect(variantB?.conversionRate).toBe(0);
  });
});
