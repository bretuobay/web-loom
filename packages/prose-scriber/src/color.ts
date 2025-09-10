/**
 * Pads a hex string with leading zeros to ensure it's 6 characters long.
 * @param hex The hex string.
 * @returns The padded hex string.
 */
function padZero(hex: string): string {
  return ('000000' + hex).slice(-6);
}

/**
 * Lightens a hex color by a given amount.
 * @param color The hex color string (e.g., "#RRGGBB").
 * @param amount The amount to lighten by (0-100).
 * @returns The lightened hex color string.
 */
export function lighten(color: string, amount: number): string {
  if (amount < 0 || amount > 100) {
    throw new Error('Amount must be between 0 and 100.');
  }

  const hex = color.startsWith('#') ? color.slice(1) : color;
  const num = parseInt(hex, 16);

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.round(Math.min(255, r + (255 * amount) / 100));
  g = Math.round(Math.min(255, g + (255 * amount) / 100));
  b = Math.round(Math.min(255, b + (255 * amount) / 100));

  const newHex = (r << 16) | (g << 8) | b;
  return '#' + padZero(newHex.toString(16));
}

/**
 * Darkens a hex color by a given amount.
 * @param color The hex color string (e.g., "#RRGGBB").
 * @param amount The amount to darken by (0-100).
 * @returns The darkened hex color string.
 */
export function darken(color: string, amount: number): string {
  if (amount < 0 || amount > 100) {
    throw new Error('Amount must be between 0 and 100.');
  }

  const hex = color.startsWith('#') ? color.slice(1) : color;
  const num = parseInt(hex, 16);
  const factor = 1 - amount / 100;

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.round(Math.max(0, r * factor));
  g = Math.round(Math.max(0, g * factor));
  b = Math.round(Math.max(0, b * factor));

  const newHex = (r << 16) | (g << 8) | b;
  return '#' + padZero(newHex.toString(16));
}

export function areColorsSimilar(
  color1: [number, number, number],
  color2: [number, number, number],
  similarity: number,
): boolean {
  const colorDistance = (c1: [number, number, number], c2: [number, number, number]) => {
    return Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2));
  };
  const maxColorDistance = Math.sqrt(Math.pow(255, 2) + Math.pow(255, 2) + Math.pow(255, 2));
  const similarityThreshold = (similarity / 100) * maxColorDistance;

  return colorDistance(color1, color2) <= similarityThreshold;
}

export function convertHexToRGBA(color: string): number {
  // Remove the leading '#' if present
  if (color.startsWith('#')) {
    color = color.slice(1);
  }

  // Convert the color to a number and add the alpha channel
  const colorValue = parseInt(color, 16);
  const alphaChannel = 0xff;
  return (colorValue << 8) | alphaChannel;
}
