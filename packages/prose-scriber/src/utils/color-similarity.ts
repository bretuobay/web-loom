// Types for color representation
export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];
export type HSLColor = [number, number, number];
export type LABColor = [number, number, number];

export interface ColorSimilarityOptions {
  /** Similarity threshold (0-100) */
  threshold?: number;
  /** Color space for comparison: 'rgb', 'hsl', 'lab' */
  colorSpace?: 'rgb' | 'hsl' | 'lab';
  /** Whether to consider alpha channel in comparison */
  includeAlpha?: boolean;
}

/**
 * Validates and normalizes a hex color string
 * @param hex - Hex color string (with or without #)
 * @returns Normalized 6-character hex string without #
 */
export function normalizeHex(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Validate hex format
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(hex)) {
    throw new Error(`Invalid hex color format: #${hex}`);
  }

  // Convert 3-digit to 6-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Ensure 6 digits (remove alpha if present)
  if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }

  return hex.toUpperCase();
}

/**
 * Converts hex color to RGB values
 * @param hex - Hex color string
 * @returns RGB color tuple [r, g, b]
 */
export function hexToRGB(hex: string): RGBColor {
  const normalizedHex = normalizeHex(hex);

  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  return [r, g, b];
}

/**
 * Converts hex color to RGBA values
 * @param hex - Hex color string (can include alpha)
 * @returns RGBA color tuple [r, g, b, a]
 */
export function hexToRGBA(hex: string): RGBAColor {
  hex = hex.replace('#', '');

  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(hex)) {
    throw new Error(`Invalid hex color format: #${hex}`);
  }

  // Convert 3-digit to 6-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

  return [r, g, b, a];
}

/**
 * Converts RGB to HSL color space
 * @param rgb - RGB color tuple
 * @returns HSL color tuple [h, s, l]
 */
export function rgbToHSL(rgb: RGBColor): HSLColor {
  const [r, g, b] = rgb.map((val) => val / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Lightness
  const l = (max + min) / 2;

  if (diff === 0) {
    return [0, 0, l * 100]; // Achromatic
  }

  // Saturation
  const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

  // Hue
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / diff + 2) / 6;
      break;
    case b:
      h = ((r - g) / diff + 4) / 6;
      break;
    default:
      h = 0;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Converts RGB to LAB color space (approximate conversion)
 * @param rgb - RGB color tuple
 * @returns LAB color tuple [L, a, b]
 */
export function rgbToLAB(rgb: RGBColor): LABColor {
  // First convert RGB to XYZ
  let [r, g, b] = rgb.map((val) => {
    val = val / 255;
    if (val > 0.04045) {
      val = Math.pow((val + 0.055) / 1.055, 2.4);
    } else {
      val = val / 12.92;
    }
    return val * 100;
  });

  // Observer = 2°, Illuminant = D65
  let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  x = x / 95.047;
  y = y / 100.0;
  z = z / 108.883;

  [x, y, z] = [x, y, z].map((val) => {
    if (val > 0.008856) {
      val = Math.pow(val, 1 / 3);
    } else {
      val = 7.787 * val + 16 / 116;
    }
    return val;
  });

  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const bLab = 200 * (y - z);

  return [L, a, bLab];
}

/**
 * Calculates Euclidean distance between two RGB colors
 * @param color1 - First RGB color
 * @param color2 - Second RGB color
 * @returns Distance value
 */
export function rgbDistance(color1: RGBColor, color2: RGBColor): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) + Math.pow(color1[1] - color2[1], 2) + Math.pow(color1[2] - color2[2], 2),
  );
}

/**
 * Calculates Delta E CIE76 distance in LAB color space
 * More perceptually accurate than RGB distance
 * @param lab1 - First LAB color
 * @param lab2 - Second LAB color
 * @returns Delta E distance
 */
export function deltaE76(lab1: LABColor, lab2: LABColor): number {
  return Math.sqrt(Math.pow(lab1[0] - lab2[0], 2) + Math.pow(lab1[1] - lab2[1], 2) + Math.pow(lab1[2] - lab2[2], 2));
}

/**
 * Calculates HSL distance with proper hue wraparound
 * @param hsl1 - First HSL color
 * @param hsl2 - Second HSL color
 * @returns Distance value
 */
export function hslDistance(hsl1: HSLColor, hsl2: HSLColor): number {
  // Calculate hue difference with wraparound
  const hueDiff = Math.min(Math.abs(hsl1[0] - hsl2[0]), 360 - Math.abs(hsl1[0] - hsl2[0]));

  return Math.sqrt(
    Math.pow((hueDiff / 360) * 100, 2) + // Normalize hue to 0-100 scale
      Math.pow(hsl1[1] - hsl2[1], 2) +
      Math.pow(hsl1[2] - hsl2[2], 2),
  );
}

/**
 * Enhanced color similarity comparison with multiple color spaces
 * @param color1 - First RGB color tuple
 * @param color2 - Second RGB color tuple
 * @param options - Comparison options
 * @returns True if colors are similar within threshold
 */
export function areColorsSimilar(color1: RGBColor, color2: RGBColor, options: ColorSimilarityOptions = {}): boolean {
  const { threshold = 10, colorSpace = 'rgb', includeAlpha = false } = options;

  if (threshold < 0 || threshold > 100) {
    throw new Error('Threshold must be between 0 and 100');
  }

  let distance: number;
  let maxDistance: number;

  switch (colorSpace) {
    case 'rgb':
      distance = rgbDistance(color1, color2);
      maxDistance = Math.sqrt(3 * Math.pow(255, 2)); // ~441.67
      break;

    case 'hsl':
      const hsl1 = rgbToHSL(color1);
      const hsl2 = rgbToHSL(color2);
      distance = hslDistance(hsl1, hsl2);
      maxDistance = Math.sqrt(3 * Math.pow(100, 2)); // ~173.2
      break;

    case 'lab':
      const lab1 = rgbToLAB(color1);
      const lab2 = rgbToLAB(color2);
      distance = deltaE76(lab1, lab2);
      maxDistance = 100; // Delta E typically ranges 0-100
      break;

    default:
      throw new Error(`Unsupported color space: ${colorSpace}`);
  }

  const similarityThreshold = (threshold / 100) * maxDistance;
  return distance <= similarityThreshold;
}

/**
 * Compare hex colors for similarity
 * @param hex1 - First hex color
 * @param hex2 - Second hex color
 * @param options - Comparison options
 * @returns True if colors are similar within threshold
 */
export function areHexColorsSimilar(hex1: string, hex2: string, options: ColorSimilarityOptions = {}): boolean {
  try {
    const rgb1 = hexToRGB(hex1);
    const rgb2 = hexToRGB(hex2);
    return areColorsSimilar(rgb1, rgb2, options);
  } catch (error) {
    console.error('Error comparing hex colors:', error);
    return false;
  }
}

/**
 * Get color similarity percentage between two colors
 * @param color1 - First RGB color
 * @param color2 - Second RGB color
 * @param colorSpace - Color space for comparison
 * @returns Similarity percentage (0-100)
 */
export function getColorSimilarityPercentage(
  color1: RGBColor,
  color2: RGBColor,
  colorSpace: 'rgb' | 'hsl' | 'lab' = 'rgb',
): number {
  let distance: number;
  let maxDistance: number;

  switch (colorSpace) {
    case 'rgb':
      distance = rgbDistance(color1, color2);
      maxDistance = Math.sqrt(3 * Math.pow(255, 2));
      break;

    case 'hsl':
      const hsl1 = rgbToHSL(color1);
      const hsl2 = rgbToHSL(color2);
      distance = hslDistance(hsl1, hsl2);
      maxDistance = Math.sqrt(3 * Math.pow(100, 2));
      break;

    case 'lab':
      const lab1 = rgbToLAB(color1);
      const lab2 = rgbToLAB(color2);
      distance = deltaE76(lab1, lab2);
      maxDistance = 100;
      break;
  }

  const similarity = Math.max(0, 100 - (distance / maxDistance) * 100);
  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}

/**
 * Get color similarity percentage between two hex colors
 * @param hex1 - First hex color
 * @param hex2 - Second hex color
 * @param colorSpace - Color space for comparison
 * @returns Similarity percentage (0-100)
 */
export function getHexColorSimilarityPercentage(
  hex1: string,
  hex2: string,
  colorSpace: 'rgb' | 'hsl' | 'lab' = 'rgb',
): number {
  const rgb1 = hexToRGB(hex1);
  const rgb2 = hexToRGB(hex2);
  return getColorSimilarityPercentage(rgb1, rgb2, colorSpace);
}

/**
 * Find the most similar color from a palette
 * @param targetColor - Target RGB color
 * @param palette - Array of RGB colors to compare against
 * @param colorSpace - Color space for comparison
 * @returns Object with the most similar color and its similarity percentage
 */
export function findMostSimilarColor(
  targetColor: RGBColor,
  palette: RGBColor[],
  colorSpace: 'rgb' | 'hsl' | 'lab' = 'rgb',
): { color: RGBColor; similarity: number; index: number } {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  let bestMatch = palette[0];
  let bestSimilarity = getColorSimilarityPercentage(targetColor, palette[0], colorSpace);
  let bestIndex = 0;

  for (let i = 1; i < palette.length; i++) {
    const similarity = getColorSimilarityPercentage(targetColor, palette[i], colorSpace);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = palette[i];
      bestIndex = i;
    }
  }

  return {
    color: bestMatch,
    similarity: bestSimilarity,
    index: bestIndex,
  };
}

/**
 * Find the most similar hex color from a palette
 * @param targetHex - Target hex color
 * @param hexPalette - Array of hex colors to compare against
 * @param colorSpace - Color space for comparison
 * @returns Object with the most similar hex color and its similarity percentage
 */
export function findMostSimilarHexColor(
  targetHex: string,
  hexPalette: string[],
  colorSpace: 'rgb' | 'hsl' | 'lab' = 'rgb',
): { color: string; similarity: number; index: number } {
  const targetRGB = hexToRGB(targetHex);
  const rgbPalette = hexPalette.map((hex) => hexToRGB(hex));

  const result = findMostSimilarColor(targetRGB, rgbPalette, colorSpace);

  return {
    color: hexPalette[result.index],
    similarity: result.similarity,
    index: result.index,
  };
}

/**
 * Legacy function - Fixed version of the original convertHexToRGBA
 * @param hex - Hex color string
 * @returns RGBA as a single number (packed format)
 */
export function convertHexToRGBA(hex: string): number {
  const rgba = hexToRGBA(hex);
  const [r, g, b, a] = rgba;
  const alpha = Math.round(a * 255);

  // Pack RGBA into a single number: RRGGBBAA
  return (r << 24) | (g << 16) | (b << 8) | alpha;
}

/**
 * // Basic hex color comparison
const similar = areHexColorsSimilar('#FF0000', '#FE0000', { threshold: 5 });

// Using LAB color space for perceptual accuracy
const perceptual = areHexColorsSimilar('#FF0000', '#FE0000', { 
  threshold: 10, 
  colorSpace: 'lab' 
});

// Get exact similarity percentage
const similarity = getHexColorSimilarityPercentage('#FF0000', '#FE0000', 'lab');

// Find closest match in a palette
const closest = findMostSimilarHexColor('#FF5733', [
  '#FF0000', '#00FF00', '#0000FF', '#FF6666'
]);
 */
