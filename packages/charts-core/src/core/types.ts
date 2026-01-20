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

export interface SeriesConfig<T extends ChartDataPoint = ChartDataPoint> {
  id?: string;
  type: 'line' | 'area' | 'scatter';
  data: T[];
  xAccessor: (datum: T) => Date | number;
  yAccessor: (datum: T) => number;
  xScale?: string;
  yScale?: string;
  color?: string;
  strokeWidth?: number;
  area?: boolean;
}

export interface AxisConfig {
  id: string;
  title?: string;
  orient: AxisOrientation;
  scale: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  format?: (value: number | Date) => string;
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

export interface ChartConfig {
  width: number;
  height: number;
  margin: Margin;
  localization: LocalizationConfig;
  animation?: AnimationConfig;
  accessibility?: AccessibilityConfig;
  tooltip?: TooltipConfig;
}
