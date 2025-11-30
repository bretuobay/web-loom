import { webcrypto } from 'node:crypto';
import { build } from 'vite';

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
} else if (typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto.getRandomValues = webcrypto.getRandomValues.bind(webcrypto);
}

await build({
  mode: process.env.NODE_ENV ?? 'development',
  build: {
    watch: {},
  },
});
