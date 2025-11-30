export interface ScaleResult {
  baseSize: number;
  ratio: number;
  steps: number;
  values: number[];
  map: Record<number, number>;
}

export interface VerticalRhythmMap {
  baseLineHeight: number;
  multiples: number[];
  rhythm: number[];
  tokens: Record<string, string>;
}

export interface TextMeasurementOptions {
  fontWeight?: string | number;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface TextMeasurementResult {
  width: number;
  height: number;
  baseline: number;
}
