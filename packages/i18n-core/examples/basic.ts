// Basic usage example
import { LocaleStore, TranslationRegistry, createTranslator } from '../src';

const store = new LocaleStore('en-US');
const registry = new TranslationRegistry();
registry.register('en-US', { hello: 'Hello' });
const t = createTranslator(registry, store.getLocale());
console.log(t('hello')); // "Hello"
