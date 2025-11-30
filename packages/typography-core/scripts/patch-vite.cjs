const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const target = path.join(rootDir, 'node_modules', 'vite', 'dist', 'node', 'chunks', 'dep-D4NMHUTW.js');

if (!fs.existsSync(target)) {
  console.warn('[patch-vite] Skipped: vite chunk not found at', target);
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf8');
let modified = false;

const fsImportOriginal = "import fsp, { constants as constants$3 } from 'node:fs/promises';";
const fsImportPatched = "import fsp from 'node:fs/promises';";
const fsConstLine = "const constants$3 = fs$8.constants ?? fs__default.constants ?? {};";
const urlImportLine = "import require$$1$1, { fileURLToPath as fileURLToPath$1, URL as URL$3, pathToFileURL as pathToFileURL$1 } from 'node:url';";

if (content.includes(fsImportOriginal)) {
  content = content.replace(fsImportOriginal, fsImportPatched);
  modified = true;
}

if (!content.includes(fsConstLine) && content.includes(urlImportLine)) {
  content = content.replace(urlImportLine, `${urlImportLine}\n${fsConstLine}`);
  modified = true;
}

const cryptoImportLine = "import crypto$2 from 'node:crypto';";
const cryptoHelperBlock = "const cryptoHelper = (crypto$2 == null ? void 0 : crypto$2.webcrypto) ?? crypto$2;\nif (cryptoHelper && typeof cryptoHelper.getRandomValues === \"function\" && typeof crypto$2.getRandomValues !== \"function\") {\n  crypto$2.getRandomValues = cryptoHelper.getRandomValues.bind(cryptoHelper);\n}";

if (content.includes(cryptoImportLine) && !content.includes('cryptoHelper && typeof cryptoHelper.getRandomValues')) {
  content = content.replace(cryptoImportLine, `${cryptoImportLine}\n${cryptoHelperBlock}`);
  modified = true;
}

if (modified) {
  fs.writeFileSync(target, content, 'utf8');
  console.log('[patch-vite] Applied compatibility fixes for older Node environments.');
} else {
  console.log('[patch-vite] No changes required.');
}
