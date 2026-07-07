import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const budgets = [
  ['dist/loader.js', 2 * 1024],
  ['dist/host.js', 8 * 1024],
  ['dist/widget.js', 6 * 1024],
];

let failed = false;

for (const [file, maxBytes] of budgets) {
  const gzippedBytes = gzipSync(readFileSync(new URL(`../${file}`, import.meta.url))).length;
  const gzippedKb = (gzippedBytes / 1024).toFixed(2);
  const maxKb = (maxBytes / 1024).toFixed(2);

  if (gzippedBytes > maxBytes) {
    failed = true;
    console.error(`embed-core size budget exceeded: ${file} is ${gzippedKb} KB gzip, max ${maxKb} KB`);
  } else {
    console.log(`embed-core size budget ok: ${file} is ${gzippedKb} KB gzip, max ${maxKb} KB`);
  }
}

if (failed) {
  process.exitCode = 1;
}
