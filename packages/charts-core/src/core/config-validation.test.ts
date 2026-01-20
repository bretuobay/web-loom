import { describe, expect, it } from 'vitest';
import { validateChartConfig } from './config-validation';

describe('validateChartConfig', () => {
  const baseConfig = {
    width: 800,
    height: 400,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    localization: { locale: 'en-US' },
    axes: [{ id: 'x-axis', orient: 'bottom', scale: 'x' }],
    series: [
      {
        type: 'line',
        data: [{ x: new Date(0), y: 1 }],
        xAccessor: (datum: { x: Date; y: number }) => datum.x,
        yAccessor: (datum: { x: Date; y: number }) => datum.y,
      },
    ],
  };

  it('returns a valid result when required fields are present', () => {
    const result = validateChartConfig(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports multiple errors for invalid layout values', () => {
    const result = validateChartConfig({
      width: 0,
      height: -5,
      localization: {},
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Width must be a positive number.',
        'Height must be a positive number.',
        'Margin must be defined.',
        'Localization locale must be provided.',
      ]),
    );
  });

  it('flags invalid axis orientations', () => {
    const result = validateChartConfig({
      ...baseConfig,
      axes: [
        {
          id: 'invalid',
          orient: 'diagonal' as any,
          scale: 'x',
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(['Axis[0] orient must be one of top, bottom, left, right.']));
  });

  it('reports missing series helpers', () => {
    const result = validateChartConfig({
      ...baseConfig,
      series: [
        {
          type: 'line',
        } as any,
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Series[0] must provide a data array.',
        'Series[0] must provide an xAccessor.',
        'Series[0] must provide a yAccessor.',
      ]),
    );
  });
});
