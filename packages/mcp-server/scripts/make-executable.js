import { chmodSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const entryPath = join(__dirname, "../dist/index.js");

// Prepend shebang so the bin works without `node` prefix
const content = readFileSync(entryPath, "utf8");
if (!content.startsWith("#!")) {
  writeFileSync(entryPath, `#!/usr/bin/env node\n${content}`);
}
chmodSync(entryPath, 0o755);
