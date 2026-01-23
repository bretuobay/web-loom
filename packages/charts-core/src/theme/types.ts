import type { Margin } from '../core/types';

export interface ChartTheme {
  name: string;
  colors: {
    series: string[];
    background: string;
    grid: string;
    axis: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      axis: number;
      tooltip: number;
      legend: number;
    };
  };
  spacing: {
    margin: Margin;
    padding: number;
  };
  animation: {
    duration: number;
    easing: string;
  };
  shadows: {
    marker: string;
    tooltip: string;
  };
}
