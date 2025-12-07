import { describe, it, expect } from 'vitest';
import { LocaleStore } from '../store';

describe('LocaleStore', () => {
  it('initializes with given locale', () => {
    const store = new LocaleStore('en-US');
    expect(store.getLocale()).toBe('en-US');
  });

  it('setLocale updates and notifies subscribers', () => {
    const store = new LocaleStore('en-US');
    let notified: string | undefined;
    store.subscribe((locale) => {
      notified = locale;
    });
    store.setLocale('fr-FR');
    expect(store.getLocale()).toBe('fr-FR');
    expect(notified).toBe('fr-FR');
  });

  it('subscribe returns unsubscribe function', () => {
    const store = new LocaleStore('en-US');
    let count = 0;
    const unsub = store.subscribe(() => {
      count++;
    });
    store.setLocale('fr-FR');
    unsub();
    store.setLocale('es-ES');
    expect(count).toBe(2); // initial + first change
  });
});
