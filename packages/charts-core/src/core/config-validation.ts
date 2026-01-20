import type { AxisConfig, ChartConfig, SeriesConfig } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ORIENTATIONS: AxisConfig['orient'][] = ['top', 'bottom', 'left', 'right'];

function isValidRange(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateMargin(margin: ChartConfig['margin'] | undefined, errors: string[]): void {
  if (!margin) {
    errors.push('Margin must be defined.');
    return;
  }

  const edges: (keyof ChartConfig['margin'])[] = ['top', 'right', 'bottom', 'left'];
  edges.forEach((edge) => {
    const value = margin[edge];
    if (!isValidRange(value) || value < 0) {
      errors.push(`Margin.${edge} must be a non-negative number.`);
    }
  });
}

function validateAxes(axes: AxisConfig[] | undefined, errors: string[]): void {
  if (!axes) {
    return;
  }

  axes.forEach((axis, index) => {
    if (!axis.id) {
      errors.push(`Axis[${index}] must have an id.`);
    }

    if (!axis.scale) {
      errors.push(`Axis[${index}] must specify a scale id.`);
    }

    if (!ORIENTATIONS.includes(axis.orient)) {
      errors.push(`Axis[${index}] orient must be one of ${ORIENTATIONS.join(', ')}.`);
    }
  });
}

function validateSeries(series: SeriesConfig[] | undefined, errors: string[]): void {
  if (!series) {
    return;
  }

  series.forEach((serie, index) => {
    if (!serie.type) {
      errors.push(`Series[${index}] is missing a type.`);
    }

    if (!Array.isArray(serie.data)) {
      errors.push(`Series[${index}] must provide a data array.`);
    }

    if (typeof serie.xAccessor !== 'function') {
      errors.push(`Series[${index}] must provide an xAccessor.`);
    }

    if (typeof serie.yAccessor !== 'function') {
      errors.push(`Series[${index}] must provide a yAccessor.`);
    }
  });
}

export function validateChartConfig(config: Partial<ChartConfig>): ValidationResult {
  const errors: string[] = [];

  if (!isValidRange(config.width) || config.width! <= 0) {
    errors.push('Width must be a positive number.');
  }

  if (!isValidRange(config.height) || config.height! <= 0) {
    errors.push('Height must be a positive number.');
  }

  validateMargin(config.margin, errors);

  if (!config.localization || !config.localization.locale?.trim()) {
    errors.push('Localization locale must be provided.');
  }

  validateAxes(config.axes, errors);
  validateSeries(config.series, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}
