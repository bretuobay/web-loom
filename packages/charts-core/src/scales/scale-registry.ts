import type { ScaleContinuousNumeric } from 'd3-scale';

export type ChartScale = ScaleContinuousNumeric<number, number>;

export class ScaleRegistry {
  private readonly scales = new Map<string, ChartScale>();

  register(id: string, scale: ChartScale): void {
    this.scales.set(id, scale);
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
