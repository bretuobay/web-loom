import { scaleLinear, scaleTime } from 'd3-scale';
import type { ScaleLinear, ScaleTime } from 'd3-scale';
import type { ChartScaleConfig } from '../core/types';

export type ChartScale = ScaleLinear<number, number> | ScaleTime<number, number>;

export class ScaleRegistry {
  private readonly scales = new Map<string, ChartScale>();

  register(id: string, scale: ChartScale): void {
    this.scales.set(id, scale);
  }

  create(config: ChartScaleConfig): ChartScale {
    const scale = config.type === 'time' ? scaleTime<number, number>() : scaleLinear<number, number>();

    if (config.domain) {
      (scale as any).domain(config.domain);
    }

    if (config.range) {
      scale.range(config.range);
    }

    this.register(config.id, scale);
    return scale;
  }

  get(id: string): ChartScale | undefined {
    return this.scales.get(id);
  }

  updateDomain(id: string, domain: [number, number]): void {
    const scale = this.scales.get(id);
    if (scale) {
      scale.domain(domain);
    }
  }

  updateRange(id: string, range: [number, number]): void {
    const scale = this.scales.get(id);
    if (scale) {
      scale.range(range);
    }
  }

  clear(): void {
    this.scales.clear();
  }

  list(): string[] {
    return [...this.scales.keys()];
  }
}
