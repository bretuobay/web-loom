export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export function isValidLogLevel(level: string): level is LogLevel {
  return level in LOG_LEVELS;
}

export function shouldLog(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
  return LOG_LEVELS[targetLevel] >= LOG_LEVELS[currentLevel];
}
