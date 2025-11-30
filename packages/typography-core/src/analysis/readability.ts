import type { ContentInsights, ReadabilityScores, ReadingTime, TextMetricsSummary } from './types';

const countWords = (text: string): number => {
  const matches = text.trim().match(/\b[\w'-]+\b/gi);
  return matches ? matches.length : 0;
};

const countSentences = (text: string): number => {
  const matches = text.replace(/\s+/g, ' ').match(/[.!?]+\s|$/g);
  return matches ? Math.max(matches.length, 1) : 1;
};

const countParagraphs = (text: string): number => {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.length || 1;
};

const countSyllables = (text: string): number => {
  return text
    .toLowerCase()
    .split(/\b/)
    .filter((word) => /[a-z]/.test(word))
    .reduce((total, word) => {
      let syllableCount = 0;
      let previousWasVowel = false;
      for (const char of word) {
        const isVowel = /[aeiouy]/.test(char);
        if (isVowel && !previousWasVowel) {
          syllableCount += 1;
          previousWasVowel = true;
        } else {
          previousWasVowel = isVowel;
        }
      }
      if (word.endsWith('e')) {
        syllableCount = Math.max(1, syllableCount - 1);
      }
      return total + Math.max(syllableCount, 1);
    }, 0);
};

export function calculateReadingTime(text: string, wordsPerMinute: number = 200): ReadingTime {
  const wordCount = countWords(text);
  const minutes = wordCount / wordsPerMinute;
  return {
    words: wordCount,
    minutes: parseFloat(minutes.toFixed(2)),
    seconds: Math.round(minutes * 60),
  };
}

export function getReadabilityScore(text: string): ReadabilityScores {
  const words = countWords(text) || 1;
  const sentences = countSentences(text) || 1;
  const syllables = countSyllables(text) || 1;

  const fleschReadingEase = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const fleschKincaidGrade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const automatedReadabilityIndex = 4.71 * (text.length / words) + 0.5 * (words / sentences) - 21.43;

  return {
    fleschReadingEase: parseFloat(fleschReadingEase.toFixed(2)),
    fleschKincaidGrade: parseFloat(fleschKincaidGrade.toFixed(2)),
    automatedReadabilityIndex: parseFloat(automatedReadabilityIndex.toFixed(2)),
  };
}

export function analyzeTextContent(text: string): TextMetricsSummary {
  const words = countWords(text);
  const sentences = countSentences(text);
  const paragraphs = countParagraphs(text);
  const syllables = countSyllables(text);

  const averageWordsPerSentence = words / sentences;
  const averageSyllablesPerWord = syllables / Math.max(words, 1);

  return {
    words,
    sentences,
    paragraphs,
    syllables,
    averageWordsPerSentence: parseFloat(averageWordsPerSentence.toFixed(2)),
    averageSyllablesPerWord: parseFloat(averageSyllablesPerWord.toFixed(2)),
  };
}

export function generateContentInsights(text: string, fontSize: number = 16): ContentInsights {
  const metrics = analyzeTextContent(text);
  const readability = getReadabilityScore(text);
  const recommendedLineLength = Math.round((fontSize * 2.5 + metrics.averageWordsPerSentence) * 1.2);

  return {
    metrics,
    readability,
    recommendedLineLength,
  };
}
