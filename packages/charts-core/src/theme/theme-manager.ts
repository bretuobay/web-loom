import type { ChartTheme } from './types';

export class ThemeManager {
  private currentTheme: ChartTheme;
  private readonly defaultTheme: ChartTheme;

  constructor() {
    this.defaultTheme = this.createDefaultTheme();
    this.currentTheme = this.defaultTheme;
  }

  private createDefaultTheme(): ChartTheme {
    return {
      name: 'default-light',
      colors: {
        series: ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
        background: '#ffffff',
        grid: 'rgba(15, 23, 42, 0.04)',
        axis: 'rgba(15, 23, 42, 0.08)',
        text: '#64748b',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: { axis: 12, tooltip: 13, legend: 13 },
      },
      spacing: {
        margin: { top: 24, right: 32, bottom: 40, left: 50 },
        padding: 12,
      },
      animation: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      shadows: {
        marker: '0 2px 4px rgba(0, 0, 0, 0.1)',
        tooltip: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    };
  }

  applyTheme(theme: Partial<ChartTheme>): void {
    this.currentTheme = this.mergeThemes(this.defaultTheme, theme);
  }

  getTheme(): ChartTheme {
    return this.currentTheme;
  }

  private mergeThemes(base: ChartTheme, override: Partial<ChartTheme>): ChartTheme {
    return {
      ...base,
      ...override,
      colors: { ...base.colors, ...override.colors },
      typography: {
        ...base.typography,
        ...override.typography,
        fontSize: {
          ...base.typography.fontSize,
          ...override.typography?.fontSize,
        },
      },
      spacing: {
        ...base.spacing,
        ...override.spacing,
        margin: { ...base.spacing.margin, ...override.spacing?.margin },
      },
      animation: { ...base.animation, ...override.animation },
      shadows: { ...base.shadows, ...override.shadows },
    };
  }
}
