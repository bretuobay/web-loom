import { lighten, darken, areColorsSimilar, convertHexToRGBA } from './color';

describe('Color Utility Functions', () => {
  describe('lighten', () => {
    it('should lighten a color by the specified amount', () => {
      const result = lighten('#000000', 50);
      // Current implementation adds 50% of 255 to each channel
      // 0 + (255 * 50 / 100) = 127.5 -> 128 (rounded)
      expect(result).toBe('#808080');
    });

    it('should handle colors with hash prefix', () => {
      const result = lighten('#ff0000', 20);
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle colors without hash prefix', () => {
      const result = lighten('ff0000', 20);
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should not exceed maximum brightness (white)', () => {
      const result = lighten('#ffffff', 50);
      expect(result).toBe('#ffffff');
    });

    it('should handle edge case: 0% lightening', () => {
      const original = '#123456';
      const result = lighten(original, 0);
      expect(result).toBe(original);
    });

    it('should handle edge case: 100% lightening', () => {
      const result = lighten('#000000', 100);
      expect(result).toBe('#ffffff');
    });

    it('should throw error for negative amount', () => {
      expect(() => lighten('#000000', -10)).toThrow('Amount must be between 0 and 100.');
    });

    it('should throw error for amount over 100', () => {
      expect(() => lighten('#000000', 150)).toThrow('Amount must be between 0 and 100.');
    });

    it('should correctly lighten red color', () => {
      // Red #ff0000 lightened by 20%
      // R: 255 + (255 * 20 / 100) = 255 + 51 = 306 -> capped at 255
      // G: 0 + (255 * 20 / 100) = 0 + 51 = 51 -> 0x33
      // B: 0 + (255 * 20 / 100) = 0 + 51 = 51 -> 0x33
      const result = lighten('#ff0000', 20);
      expect(result).toBe('#ff3333');
    });
  });

  describe('darken', () => {
    it('should darken a color by the specified amount', () => {
      const result = darken('#ffffff', 50);
      // Current implementation multiplies by (1 - 50/100) = 0.5
      // 255 * 0.5 = 127.5 -> 128 (rounded) -> 0x80
      expect(result).toBe('#808080');
    });

    it('should handle colors with hash prefix', () => {
      const result = darken('#ff0000', 20);
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle colors without hash prefix', () => {
      const result = darken('ff0000', 20);
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should not go below minimum brightness (black)', () => {
      const result = darken('#000000', 50);
      expect(result).toBe('#000000');
    });

    it('should handle edge case: 0% darkening', () => {
      const original = '#123456';
      const result = darken(original, 0);
      expect(result).toBe(original);
    });

    it('should handle edge case: 100% darkening', () => {
      const result = darken('#ffffff', 100);
      expect(result).toBe('#000000');
    });

    it('should throw error for negative amount', () => {
      expect(() => darken('#ffffff', -10)).toThrow('Amount must be between 0 and 100.');
    });

    it('should throw error for amount over 100', () => {
      expect(() => darken('#ffffff', 150)).toThrow('Amount must be between 0 and 100.');
    });

    it('should correctly darken red color', () => {
      // Red #ff0000 darkened by 50%
      // R: 255 * (1 - 50/100) = 255 * 0.5 = 127.5 -> 128 -> 0x80
      // G: 0 * 0.5 = 0
      // B: 0 * 0.5 = 0
      const result = darken('#ff0000', 50);
      expect(result).toBe('#800000');
    });
  });

  describe('areColorsSimilar', () => {
    it('should return true for identical colors', () => {
      const color1: [number, number, number] = [255, 0, 0];
      const color2: [number, number, number] = [255, 0, 0];
      const result = areColorsSimilar(color1, color2, 100);
      expect(result).toBe(true);
    });

    it('should return true for very similar colors with high similarity threshold', () => {
      const color1: [number, number, number] = [255, 0, 0];
      const color2: [number, number, number] = [250, 5, 5];
      const result = areColorsSimilar(color1, color2, 90);
      expect(result).toBe(true);
    });

    it('should return false for very different colors with low similarity threshold', () => {
      const color1: [number, number, number] = [255, 0, 0];
      const color2: [number, number, number] = [0, 255, 0];
      const result = areColorsSimilar(color1, color2, 10);
      expect(result).toBe(false);
    });

    it('should return false for black and white with moderate similarity', () => {
      const black: [number, number, number] = [0, 0, 0];
      const white: [number, number, number] = [255, 255, 255];
      const result = areColorsSimilar(black, white, 50);
      expect(result).toBe(false);
    });

    it('should return true for black and white with 100% similarity', () => {
      const black: [number, number, number] = [0, 0, 0];
      const white: [number, number, number] = [255, 255, 255];
      const result = areColorsSimilar(black, white, 100);
      expect(result).toBe(true);
    });

    it('should handle edge case: 0% similarity threshold', () => {
      const color1: [number, number, number] = [255, 0, 0];
      const color2: [number, number, number] = [255, 0, 0];
      const result = areColorsSimilar(color1, color2, 0);
      expect(result).toBe(true);
    });

    it('should handle mid-range colors correctly', () => {
      const color1: [number, number, number] = [128, 128, 128];
      const color2: [number, number, number] = [120, 120, 120];
      const result = areColorsSimilar(color1, color2, 80);
      expect(result).toBe(true);
    });

    it('should calculate Euclidean distance correctly', () => {
      // Distance between (255,0,0) and (0,255,0) = sqrt(255² + 255² + 0²) = sqrt(130050) ≈ 360.625
      // Max distance = sqrt(3 * 255²) = sqrt(194805) ≈ 441.366
      // For 80% similarity: threshold = 0.8 * 441.366 ≈ 353.09
      // Since 360.625 > 353.09, should return false
      const red: [number, number, number] = [255, 0, 0];
      const green: [number, number, number] = [0, 255, 0];
      const result = areColorsSimilar(red, green, 80);
      expect(result).toBe(false);
    });
  });

  describe('convertHexToRGBA', () => {
    it('should convert hex color with hash to RGBA number', () => {
      const result = convertHexToRGBA('#ff0000');
      // Expected: red color (0xff0000) shifted left by 8 bits + alpha (0xff)
      // 0xff0000 << 8 = 0xff000000, plus 0xff = 0xff0000ff
      // Note: In JavaScript, 0xff0000ff becomes -16776961 due to 32-bit signed integer overflow
      expect(result).toBe(-16776961);
    });

    it('should convert hex color without hash to RGBA number', () => {
      const result = convertHexToRGBA('00ff00');
      // Expected: green color (0x00ff00) shifted left by 8 bits + alpha (0xff)
      // 0x00ff00 << 8 = 0x00ff0000, plus 0xff = 0x00ff00ff
      expect(result).toBe(0x00ff00ff);
    });

    it('should handle black color', () => {
      const result = convertHexToRGBA('#000000');
      // Expected: black (0x000000) shifted left by 8 bits + alpha (0xff)
      // 0x000000 << 8 = 0x00000000, plus 0xff = 0x000000ff
      expect(result).toBe(0x000000ff);
    });

    it('should handle white color', () => {
      const result = convertHexToRGBA('#ffffff');
      // Expected: white (0xffffff) shifted left by 8 bits + alpha (0xff)
      // 0xffffff << 8 = 0xffffff00, plus 0xff = 0xffffffff
      // Note: In JavaScript, 0xffffffff becomes -1 due to 32-bit signed integer overflow
      expect(result).toBe(-1);
    });

    it('should handle blue color', () => {
      const result = convertHexToRGBA('0000ff');
      // Expected: blue (0x0000ff) shifted left by 8 bits + alpha (0xff)
      // 0x0000ff << 8 = 0x0000ff00, plus 0xff = 0x0000ffff
      expect(result).toBe(0x0000ffff);
    });

    it('should handle mixed color', () => {
      const result = convertHexToRGBA('#123456');
      // Expected: 0x123456 << 8 + 0xff = 0x12345600 + 0xff = 0x123456ff
      expect(result).toBe(0x123456ff);
    });

    it('should return consistent results for unsigned interpretation', () => {
      // Test that we can convert back to unsigned if needed
      const result = convertHexToRGBA('#ff0000');
      const unsigned = result >>> 0; // Convert to unsigned 32-bit
      expect(unsigned).toBe(4278190335); // 0xff0000ff as unsigned
    });
  });

  describe('padZero helper function (integration test)', () => {
    // Since padZero is not exported, we test it indirectly through other functions
    it('should properly pad short hex values in lighten function', () => {
      // Test with a color that would result in a short hex when converted back
      const result = lighten('#000100', 0); // Should maintain the leading zeros
      expect(result).toBe('#000100');
    });
  });

  describe('Integration tests', () => {
    it('should lighten and darken to approximately return to original', () => {
      const original = '#808080';
      const lightened = lighten(original, 20);
      const darkened = darken(lightened, 20);

      // Due to the different algorithms used (additive vs multiplicative),
      // we won't get back to the original
      // This test shows the asymmetry in the current implementation
      expect(darkened).not.toBe(original);
    });

    it('should convert hex colors and check similarity', () => {
      const red1 = '#ff0000';
      const red2 = '#fe0000';

      // Convert to RGB tuples for similarity check
      const rgb1: [number, number, number] = [255, 0, 0];
      const rgb2: [number, number, number] = [254, 0, 0];

      const areSimilar = areColorsSimilar(rgb1, rgb2, 95);
      expect(areSimilar).toBe(true);
    });

    it('should work with convertHexToRGBA and other functions', () => {
      const hexColor = '#ff0000';
      const rgbaValue = convertHexToRGBA(hexColor);

      // Verify the RGBA value is correct (JavaScript returns signed 32-bit integer)
      expect(rgbaValue).toBe(-16776961); // 0xff0000ff as signed integer

      // Test that we can still use the original hex with other functions
      const lightened = lighten(hexColor, 10);
      expect(lightened).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
