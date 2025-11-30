import type { AccessibilityReport } from './types';

interface RGB {
  r: number;
  g: number;
  b: number;
}

const parseColor = (value?: string): RGB | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const int = parseInt(normalized, 16);
    if (Number.isNaN(int)) {
      return null;
    }
    return {
      r: (int >> 16) & 0xff,
      g: (int >> 8) & 0xff,
      b: int & 0xff,
    };
  }

  const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((part) => parseFloat(part));
    if (parts.length >= 3 && parts.every((num) => !Number.isNaN(num))) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }

  return null;
};

const luminance = (value: number) => {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const getContrastRatio = (foreground: RGB | null, background: RGB | null): number | undefined => {
  if (!foreground || !background) {
    return undefined;
  }

  const L1 =
    0.2126 * luminance(foreground.r) + 0.7152 * luminance(foreground.g) + 0.0722 * luminance(foreground.b) + 0.05;
  const L2 =
    0.2126 * luminance(background.r) + 0.7152 * luminance(background.g) + 0.0722 * luminance(background.b) + 0.05;
  const ratio = L1 > L2 ? L1 / L2 : L2 / L1;
  return parseFloat(ratio.toFixed(2));
};

export function validateTextAccessibility(element?: HTMLElement | null): AccessibilityReport {
  if (!element || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return {
      fontSize: 0,
      passesAA: false,
      warnings: ['No element provided or DOM unavailable for accessibility validation.'],
    };
  }

  const styles = window.getComputedStyle(element);
  const fontSize = parseFloat(styles.fontSize || '0');
  const color = parseColor(styles.color || '#000000');
  const background = parseColor(styles.backgroundColor || '#ffffff');
  const contrastRatio = getContrastRatio(color, background);
  const isLargeText =
    fontSize >= 18 || (styles.fontWeight ? parseInt(styles.fontWeight, 10) >= 700 && fontSize >= 14 : false);
  const minimumContrast = isLargeText ? 3 : 4.5;

  const warnings: string[] = [];
  if (!contrastRatio) {
    warnings.push('Unable to determine color contrast.');
  } else if (contrastRatio < minimumContrast) {
    warnings.push(`Contrast ratio ${contrastRatio}:1 fails WCAG AA minimum of ${minimumContrast}:1.`);
  }

  if (!isLargeText && fontSize < 16) {
    warnings.push('Increase font size to at least 16px for comfortable reading.');
  }

  return {
    fontSize,
    contrastRatio,
    passesAA: (contrastRatio ?? 0) >= minimumContrast,
    warnings,
  };
}
