import type { ChartDataPoint } from '../core/types';

/**
 * Creates a mock SVG container for testing
 */
export function createMockSVGContainer(): SVGGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(g);
  document.body.appendChild(svg);
  return g;
}

/**
 * Creates a mock HTML container for testing
 */
export function createMockHTMLContainer(): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '800px';
  div.style.height = '600px';
  document.body.appendChild(div);
  return div;
}

/**
 * Cleans up DOM elements created during tests
 */
export function cleanupDOM(): void {
  document.body.innerHTML = '';
}

/**
 * Generates time series data for testing
 */
export function generateTimeSeriesData(
  count: number,
  startDate: Date = new Date('2024-01-01'),
  intervalMs: number = 3600000 // 1 hour
): ChartDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    x: new Date(startDate.getTime() + i * intervalMs),
    y: Math.random() * 100,
  }));
}

/**
 * Generates numeric series data for testing
 */
export function generateNumericSeriesData(
  count: number,
  minY: number = 0,
  maxY: number = 100
): ChartDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i,
    y: minY + Math.random() * (maxY - minY),
  }));
}

/**
 * Waits for a specified duration (useful for animation testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gets computed style value from an element
 */
export function getComputedStyleValue(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Checks if a color string matches expected format
 */
export function isValidColor(color: string): boolean {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  const rgbaPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
  return hexPattern.test(color) || rgbaPattern.test(color);
}

/**
 * Extracts numeric value from CSS string (e.g., "12px" -> 12)
 */
export function extractNumericValue(cssValue: string): number {
  const match = cssValue.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Checks if an element has a specific attribute
 */
export function hasAttribute(element: Element, attribute: string): boolean {
  return element.hasAttribute(attribute);
}

/**
 * Gets all children of an SVG element by tag name
 */
export function getSVGChildren(parent: SVGElement, tagName: string): SVGElement[] {
  return Array.from(parent.querySelectorAll(tagName));
}
