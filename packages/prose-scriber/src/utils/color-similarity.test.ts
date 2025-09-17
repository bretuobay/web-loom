import {
  normalizeHex,
  hexToRGB,
  hexToRGBA,
  rgbToHSL,
  rgbToLAB,
  rgbDistance,
  deltaE76,
  hslDistance,
  areColorsSimilar,
  areHexColorsSimilar,
  getColorSimilarityPercentage,
  getHexColorSimilarityPercentage,
  findMostSimilarColor,
  findMostSimilarHexColor,
  convertHexToRGBA,
} from './color-similarity';

describe('color-similarity utils', () => {
  describe('normalizeHex', () => {
    it('should normalize 3-digit hex to 6-digit', () => {
      expect(normalizeHex('#abc')).toBe('AABBCC');
    });
    it('should normalize 6-digit hex', () => {
      expect(normalizeHex('123456')).toBe('123456'.toUpperCase());
    });
    it('should strip alpha from 8-digit hex', () => {
      expect(normalizeHex('123456ff')).toBe('123456'.toUpperCase());
    });
    it('should throw for invalid hex', () => {
      expect(() => normalizeHex('xyz')).toThrow();
    });
  });

  describe('hexToRGB', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRGB('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRGB('00ff00')).toEqual([0, 255, 0]);
      expect(hexToRGB('0000ff')).toEqual([0, 0, 255]);
    });
    it('should handle 3-digit hex', () => {
      expect(hexToRGB('abc')).toEqual([170, 187, 204]);
    });
  });

  describe('hexToRGBA', () => {
    it('should convert 6-digit hex to RGBA', () => {
      expect(hexToRGBA('ff0000')).toEqual([255, 0, 0, 1]);
    });
    it('should convert 8-digit hex to RGBA', () => {
      const result = hexToRGBA('ff000080');
      expect(result[0]).toBe(255);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
      expect(result[3]).toBeCloseTo(0.5, 2);
    });
    it('should handle 3-digit hex', () => {
      expect(hexToRGBA('abc')).toEqual([170, 187, 204, 1]);
    });
  });

  describe('rgbToHSL', () => {
    it('should convert RGB to HSL', () => {
      expect(rgbToHSL([255, 0, 0])).toEqual([0, 100, 50]); // Red
      expect(rgbToHSL([0, 255, 0])).toEqual([120, 100, 50]); // Green
      expect(rgbToHSL([0, 0, 255])).toEqual([240, 100, 50]); // Blue
      const grayHSL = rgbToHSL([128, 128, 128]);
      expect(grayHSL[0]).toBe(0);
      expect(grayHSL[1]).toBe(0);
      expect(grayHSL[2]).toBeGreaterThan(49.8); // Gray
      expect(grayHSL[2]).toBeLessThan(50.3); // Gray
    });
  });

  describe('rgbToLAB', () => {
    it('should convert RGB to LAB (approximate)', () => {
      const lab = rgbToLAB([255, 0, 0]);
      expect(lab.length).toBe(3);
      expect(lab[0]).toBeGreaterThan(0);
    });
  });

  describe('rgbDistance', () => {
    it('should calculate Euclidean distance', () => {
      expect(rgbDistance([255, 0, 0], [0, 255, 0])).toBeCloseTo(360.62, 2);
      expect(rgbDistance([0, 0, 0], [255, 255, 255])).toBeCloseTo(441.67, 2);
    });
  });

  describe('deltaE76', () => {
    it('should calculate Delta E distance', () => {
      const lab1 = rgbToLAB([255, 0, 0]);
      const lab2 = rgbToLAB([0, 255, 0]);
      expect(deltaE76(lab1, lab2)).toBeGreaterThan(0);
    });
  });

  describe('hslDistance', () => {
    it('should calculate HSL distance with hue wraparound', () => {
      expect(hslDistance([0, 100, 50], [360, 100, 50])).toBeCloseTo(0, 2);
      expect(hslDistance([0, 100, 50], [180, 100, 50])).toBeGreaterThan(0);
    });
  });

  describe('areColorsSimilar', () => {
    it('should compare colors in RGB space', () => {
      expect(areColorsSimilar([255, 0, 0], [255, 0, 0], { threshold: 100 })).toBe(true);
      expect(areColorsSimilar([255, 0, 0], [0, 255, 0], { threshold: 10 })).toBe(false);
    });
    it('should compare colors in HSL space', () => {
      expect(areColorsSimilar([255, 0, 0], [255, 0, 0], { colorSpace: 'hsl', threshold: 100 })).toBe(true);
    });
    it('should compare colors in LAB space', () => {
      expect(areColorsSimilar([255, 0, 0], [255, 0, 0], { colorSpace: 'lab', threshold: 100 })).toBe(true);
    });
    it('should throw for invalid threshold', () => {
      expect(() => areColorsSimilar([255, 0, 0], [255, 0, 0], { threshold: -1 })).toThrow();
    });
    it('should throw for unsupported color space', () => {
      expect(() => areColorsSimilar([255, 0, 0], [255, 0, 0], { colorSpace: 'xyz' as any })).toThrow();
    });
  });

  describe('areHexColorsSimilar', () => {
    it('should compare hex colors for similarity', () => {
      expect(areHexColorsSimilar('#ff0000', '#ff0000', { threshold: 100 })).toBe(true);
      expect(areHexColorsSimilar('#ff0000', '#00ff00', { threshold: 10 })).toBe(false);
    });
    it('should handle invalid hex gracefully', () => {
      expect(areHexColorsSimilar('bad', 'ff0000')).toBe(false);
    });
  });

  describe('getColorSimilarityPercentage', () => {
    it('should return 100 for identical colors', () => {
      expect(getColorSimilarityPercentage([255, 0, 0], [255, 0, 0])).toBe(100);
    });
    it('should return <100 for different colors', () => {
      expect(getColorSimilarityPercentage([255, 0, 0], [0, 255, 0])).toBeLessThan(100);
    });
  });

  describe('getHexColorSimilarityPercentage', () => {
    it('should return 100 for identical hex colors', () => {
      expect(getHexColorSimilarityPercentage('#ff0000', '#ff0000')).toBe(100);
    });
    it('should return <100 for different hex colors', () => {
      expect(getHexColorSimilarityPercentage('#ff0000', '#00ff00')).toBeLessThan(100);
    });
  });

  describe('findMostSimilarColor', () => {
    it('should find the most similar color in a palette', () => {
      const palette: [number, number, number][] = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
      ];
      const result = findMostSimilarColor([254, 0, 0], palette);
      expect(result.index).toBe(0);
      expect(result.similarity).toBeGreaterThan(99);
    });
    it('should throw for empty palette', () => {
      expect(() => findMostSimilarColor([255, 0, 0], [])).toThrow();
    });
  });

  describe('findMostSimilarHexColor', () => {
    it('should find the most similar hex color in a palette', () => {
      const palette = ['#ff0000', '#00ff00', '#0000ff'];
      const result = findMostSimilarHexColor('#fe0000', palette);
      expect(result.index).toBe(0);
      expect(result.similarity).toBeGreaterThan(99);
    });
  });

  describe('convertHexToRGBA', () => {
    it('should convert hex to packed RGBA number', () => {
      expect(convertHexToRGBA('#ff0000') >>> 0).toBe(0xff0000ff);
      expect(convertHexToRGBA('#ff000080') >>> 0).toBe(0xff000080);
    });
    it('should handle 3-digit hex', () => {
      expect(convertHexToRGBA('abc') >>> 0).toBe(0xaabbccff);
    });
  });
});
