// Event-based locale changes (framework-agnostic)
import type { Locale } from '../../src/types';

type Callback = (locale: Locale) => void;

export class I18nEventEmitter {
  private listeners: Set<Callback> = new Set();

  onLocaleChange(callback: Callback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emitLocaleChange(locale: Locale): void {
    for (const cb of this.listeners) {
      cb(locale);
    }
  }
}
