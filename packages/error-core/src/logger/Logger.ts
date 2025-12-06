import type { LogLevel } from '../types/config.types';

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  critical(message: string, error?: Error, data?: Record<string, unknown>): void;

  // Context management
  withContext(context: Record<string, unknown>): Logger;
  getContext(): Record<string, unknown>;

  // Child loggers
  createChild(prefix: string): Logger;

  // Log level management
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  isLevelEnabled(level: LogLevel): boolean;
}
