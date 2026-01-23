import * as fc from 'fast-check';
import type { ChartDataPoint, SeriesConfig, Margin } from '../core/types';
import type { ChartTheme } from '../theme/types';

/**
 * Arbitrary for generating valid chart data points
 */
export const chartDataPointArbitrary = (): fc.Arbitrary<ChartDataPoint> =>
  fc.record({
    x: fc.oneof(fc.date(), fc.integer()),
    y: fc.float({ min: -1000, max: 1000 }),
  });

/**
 * Arbitrary for generating arrays of chart data points
 */
export const chartDataArrayArbitrary = (
  minLength = 1,
  maxLength = 100
): fc.Arbitrary<ChartDataPoint[]> =>
  fc.array(chartDataPointArbitrary(), { minLength, maxLength });

/**
 * Arbitrary for generating color strings (hex format)
 */
export const colorArbitrary = (): fc.Arbitrary<string> =>
  fc
    .integer({ min: 0, max: 0xffffff })
    .map((num) => `#${num.toString(16).padStart(6, '0')}`);

/**
 * Arbitrary for generating margin objects
 */
export const marginArbitrary = (): fc.Arbitrary<Margin> =>
  fc.record({
    top: fc.integer({ min: 0, max: 100 }),
    right: fc.integer({ min: 0, max: 100 }),
    bottom: fc.integer({ min: 0, max: 100 }),
    left: fc.integer({ min: 0, max: 100 }),
  });

/**
 * Arbitrary for generating series configurations
 */
export const seriesConfigArbitrary = (): fc.Arbitrary<SeriesConfig> =>
  fc.record({
    id: fc.option(fc.string(), { nil: undefined }),
    type: fc.constantFrom('line', 'area', 'scatter'),
    data: chartDataArrayArbitrary(5, 50),
    xAccessor: fc.constant((d: ChartDataPoint) => d.x),
    yAccessor: fc.constant((d: ChartDataPoint) => d.y),
    color: fc.option(colorArbitrary(), { nil: undefined }),
    strokeWidth: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
    area: fc.option(fc.boolean(), { nil: undefined }),
  });

/**
 * Arbitrary for generating partial theme objects
 */
export const partialThemeArbitrary = (): fc.Arbitrary<Partial<ChartTheme>> =>
  fc.record(
    {
      name: fc.option(fc.string(), { nil: undefined }),
      colors: fc.option(
        fc.record({
          series: fc.array(colorArbitrary(), { minLength: 1, maxLength: 10 }),
          background: colorArbitrary(),
          grid: colorArbitrary(),
          axis: colorArbitrary(),
          text: colorArbitrary(),
        }),
        { nil: undefined }
      ),
      typography: fc.option(
        fc.record({
          fontFamily: fc.string(),
          fontSize: fc.record({
            axis: fc.integer({ min: 8, max: 20 }),
            tooltip: fc.integer({ min: 8, max: 20 }),
            legend: fc.integer({ min: 8, max: 20 }),
          }),
        }),
        { nil: undefined }
      ),
      spacing: fc.option(
        fc.record({
          margin: marginArbitrary(),
          padding: fc.integer({ min: 0, max: 50 }),
        }),
        { nil: undefined }
      ),
      animation: fc.option(
        fc.record({
          duration: fc.integer({ min: 100, max: 1000 }),
          easing: fc.constantFrom('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'),
        }),
        { nil: undefined }
      ),
      shadows: fc.option(
        fc.record({
          marker: fc.string(),
          tooltip: fc.string(),
        }),
        { nil: undefined }
      ),
    },
    { requiredKeys: [] }
  );

/**
 * Arbitrary for generating point counts for performance testing
 */
export const pointCountArbitrary = (): fc.Arbitrary<number> =>
  fc.integer({ min: 1, max: 20000 });

/**
 * Arbitrary for generating aspect ratios
 */
export const aspectRatioArbitrary = (): fc.Arbitrary<number> =>
  fc.float({ min: 0.5, max: 3.0 });
