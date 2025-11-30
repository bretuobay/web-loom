import { describe, it, expect } from 'vitest';
import { analyzeTextContent, calculateReadingTime, generateContentInsights, getReadabilityScore } from './readability';

describe('readability utilities', () => {
  const sample = 'Typography enhances clarity. Great typography improves reading experience across devices. This matters a lot!';

  it('calculates reading time', () => {
    const readingTime = calculateReadingTime(sample, 250);
    expect(readingTime.words).toBeGreaterThan(0);
    expect(readingTime.minutes).toBeGreaterThan(0);
  });

  it('generates readability scores', () => {
    const scores = getReadabilityScore(sample);
    expect(scores.fleschReadingEase).toBeLessThan(120);
    expect(scores.fleschKincaidGrade).toBeGreaterThan(0);
  });

  it('analyzes text structure', () => {
    const metrics = analyzeTextContent(sample);
    expect(metrics.words).toBeGreaterThan(metrics.sentences);
    expect(metrics.averageWordsPerSentence).toBeGreaterThan(5);
  });

  it('produces content insights bundle', () => {
    const insights = generateContentInsights(sample, 18);
    expect(insights.metrics.sentences).toBeGreaterThan(0);
    expect(insights.recommendedLineLength).toBeGreaterThan(0);
  });
});
