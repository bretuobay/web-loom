import type { LogLevel, LogEntry } from '../types/config.types';

export interface Transport {
  readonly name: string;

  log(entry: LogEntry): void | Promise<void>;

  configure(config: Record<string, unknown>): void;

  flush?(): void | Promise<void>;

  destroy?(): void | Promise<void>;

  isLevelEnabled?(level: LogLevel): boolean;
}
