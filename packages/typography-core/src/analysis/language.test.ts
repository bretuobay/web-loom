import { describe, expect, it } from 'vitest';
import { detectLanguage, detectScript, extractKeywords } from './language';

describe('language utilities', () => {
  it('detects english language characteristics', () => {
    const info = detectLanguage('The quick brown fox jumps over the lazy dog. This is an English sentence.');
    expect(info.language).toBe('en');
    expect(info.confidence).toBeGreaterThan(0);
    expect(info.script).toBe('latin');
  });

  it('detects rtl scripts', () => {
    const info = detectLanguage('مرحبا بك في تجربة القراءة الجديدة');
    expect(info.rtl).toBe(true);
  });

  it('extracts keywords above a minimum length', () => {
    const keywords = extractKeywords('Design systems improve design consistency and design communication.');
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('detects scripts via unicode ranges', () => {
    expect(detectScript('Привет мир')).toBe('cyrillic');
  });
});
