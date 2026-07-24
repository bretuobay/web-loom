import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LIMIT_BYTES = 20 * 1024;
const dir = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(dir, '..', 'dist', 'index.es.js');

let source;
try {
  source = readFileSync(bundlePath);
} catch {
  console.error(`Could not read ${bundlePath}. Run "npm run build" first.`);
  process.exit(1);
}

const gzipped = gzipSync(source);
const sizeKb = (gzipped.byteLength / 1024).toFixed(2);
const limitKb = (LIMIT_BYTES / 1024).toFixed(0);

if (gzipped.byteLength > LIMIT_BYTES) {
  console.error(`dist/index.es.js is ${sizeKb}KB gzipped, over the ${limitKb}KB budget (PRD §10).`);
  process.exit(1);
}

console.log(`dist/index.es.js is ${sizeKb}KB gzipped (budget: ${limitKb}KB).`);
