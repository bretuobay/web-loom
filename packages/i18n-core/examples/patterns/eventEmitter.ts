// Event-based locale changes (framework-agnostic)
import { EventEmitter } from '@web-loom/event-emitter-core';
import type { Locale } from '../../src/types';

type LocaleEvents = {
  localeChange: Locale;
};

export class I18nEventEmitter {
  private emitter = new EventEmitter<LocaleEvents>();

  onLocaleChange(callback: (locale: Locale) => void): () => void {
    return this.emitter.on('localeChange', callback);
  }

  emitLocaleChange(locale: Locale): void {
    this.emitter.emit('localeChange', locale);
  }
}
