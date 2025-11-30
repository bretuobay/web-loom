export interface ReadingTime {
  minutes: number;
  seconds: number;
  words: number;
}

export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  automatedReadabilityIndex: number;
}

export interface TextMetricsSummary {
  words: number;
  sentences: number;
  paragraphs: number;
  syllables: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

export interface ContentInsights {
  metrics: TextMetricsSummary;
  readability: ReadabilityScores;
  recommendedLineLength: number;
}
