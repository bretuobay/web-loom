import type { Transport } from '../logger/Transport';
import type { LogEntry, LogLevel, ConsoleMethod } from '../types/config.types';
import { shouldLog } from '../logger/LogLevel';

export class ConsoleTransport implements Transport {
  readonly name = 'console';
  private level: LogLevel = 'info';
  private colorEnabled = true;

  private readonly levelMap: Record<LogLevel, ConsoleMethod> = {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    critical: 'error',
  };

  constructor(config: { level?: LogLevel; colorEnabled?: boolean } = {}) {
    this.level = config.level || 'info';
    this.colorEnabled = config.colorEnabled ?? true;
  }

  log(entry: LogEntry): void {
    const method = this.levelMap[entry.level] || 'log';
    const timestamp = entry.timestamp.toISOString();

    if (this.colorEnabled && typeof window !== 'undefined') {
      // Browser with color support
      const style = this.getStyle(entry.level);
      console[method](
        `%c${timestamp} %c${entry.level.toUpperCase()}%c ${entry.message}`,
        'color: gray; font-size: 0.9em',
        style,
        'color: inherit',
        entry.data,
      );
    } else {
      // Node.js or browser without color support
      const levelText = entry.level.toUpperCase().padEnd(8);
      console[method](`${timestamp} ${levelText} ${entry.message}`, entry.data || '');
    }

    if (entry.error) {
      console[method]('Error details:', entry.error);
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      console[method]('Context:', entry.context);
    }
  }

  configure(config: { level?: LogLevel; colorEnabled?: boolean }): void {
    if (config.level) {
      this.level = config.level;
    }
    if (config.colorEnabled !== undefined) {
      this.colorEnabled = config.colorEnabled;
    }
  }

  isLevelEnabled(level: LogLevel): boolean {
    return shouldLog(this.level, level);
  }

  private getStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: cyan; font-weight: bold',
      info: 'color: blue; font-weight: bold',
      warn: 'color: orange; font-weight: bold',
      error: 'color: red; font-weight: bold',
      critical: 'color: white; background: red; font-weight: bold; padding: 2px 4px',
    };
    return styles[level];
  }
}
