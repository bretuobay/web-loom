export type AxisOrientation = 'top' | 'bottom' | 'left' | 'right';

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LocalizationConfig {
  locale: string;
  dateFormat?: string;
  numberFormat?: string;
  timezone?: string;
}

export interface AnimationConfig {
  duration?: number;
  easing?: string;
}

export interface AccessibilityConfig {
  ariaLabel?: string;
  focusable?: boolean;
  keyboardNavigation?: boolean;
}

export interface ChartDataPoint {
  x: Date | number;
  y: number;
  [key: string]: any;
}

export type SeriesType = 'line' | 'area' | 'scatter';
export type SeriesInterpolation = 'linear' | 'monotone' | 'basis' | 'step';

export interface SeriesMarkerConfig {
  show?: boolean;
  radius?: number;
  stroke?: string;
  fill?: string;
  hoverRadius?: number;
}

export interface SeriesConfig<T extends ChartDataPoint = ChartDataPoint> {
  id?: string;
  type: SeriesType;
  data: T[];
  xAccessor: (datum: T) => Date | number;
  yAccessor: (datum: T) => number;
  xScale?: string;
  yScale?: string;
  color?: string;
  strokeWidth?: number;
  area?: boolean;
  curve?: SeriesInterpolation;
  marker?: SeriesMarkerConfig;
  lineWidth?: number;
}

export interface AxisConfig {
  id: string;
  title?: string;
  orient: AxisOrientation;
  scale: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  format?: (value: number | Date) => string;
  ticks?: number;
}

export interface TooltipData {
  seriesId: string;
  point: ChartDataPoint;
  label?: string;
}

export interface TooltipConfig {
  enabled?: boolean;
  shared?: boolean;
  format?: (data: TooltipData) => string;
  strategy?: 'follow' | 'fixed';
}

export interface AnnotationConfig {
  id?: string;
  type: 'icon' | 'text' | 'line';
  x: Date | number;
  y: number;
  icon?: string;
  label?: string;
  tooltip?: string;
}

export type ChartScaleType = 'linear' | 'time';

export interface ChartScaleConfig {
  id: string;
  type: ChartScaleType;
  domain?: [number | Date, number | Date];
  range?: [number, number];
}

export interface ChartConfig {
  width: number;
  height: number;
  margin: Margin;
  localization: LocalizationConfig;
  animation?: AnimationConfig;
  accessibility?: AccessibilityConfig;
  tooltip?: TooltipConfig;
  series?: SeriesConfig[];
  axes?: AxisConfig[];
  annotations?: AnnotationConfig[];
  scales?: ChartScaleConfig[];
}
