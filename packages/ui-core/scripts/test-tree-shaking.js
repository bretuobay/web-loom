#!/usr/bin/env node

/**
 * Test tree-shaking by creating test bundles with individual imports
 * and measuring their sizes
 */

import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDir = resolve(__dirname, '../.tree-shaking-test');

// Test cases for individual behavior imports
const testCases = [
  {
    name: 'dialog-only',
    code: `import { createDialogBehavior } from '@web-loom/ui-core/behaviors/dialog';
const dialog = createDialogBehavior();
console.log(dialog);`,
  },
  {
    name: 'disclosure-only',
    code: `import { createDisclosureBehavior } from '@web-loom/ui-core/behaviors/disclosure';
const disclosure = createDisclosureBehavior();
console.log(disclosure);`,
  },
  {
    name: 'form-only',
    code: `import { createFormBehavior } from '@web-loom/ui-core/behaviors/form';
const form = createFormBehavior({ initialValues: {} });
console.log(form);`,
  },
  {
    name: 'list-selection-only',
    code: `import { createListSelection } from '@web-loom/ui-core/behaviors/list-selection';
const selection = createListSelection({ items: [] });
console.log(selection);`,
  },
  {
    name: 'roving-focus-only',
    code: `import { createRovingFocus } from '@web-loom/ui-core/behaviors/roving-focus';
const focus = createRovingFocus({ items: [] });
console.log(focus);`,
  },
  {
    name: 'all-behaviors',
    code: `import { createDialogBehavior, createDisclosureBehavior, createFormBehavior, createListSelection, createRovingFocus } from '@web-loom/ui-core';
const dialog = createDialogBehavior();
const disclosure = createDisclosureBehavior();
const form = createFormBehavior({ initialValues: {} });
const selection = createListSelection({ items: [] });
const focus = createRovingFocus({ items: [] });
console.log(dialog, disclosure, form, selection, focus);`,
  },
];

async function testTreeShaking() {
  console.log('🌲 Testing tree-shaking for @web-loom/ui-core\n');

  // Create test directory
  mkdirSync(testDir, { recursive: true });

  const results = [];

  for (const testCase of testCases) {
    const entryFile = resolve(testDir, `${testCase.name}.js`);
    const outDir = resolve(testDir, `dist-${testCase.name}`);

    // Write test entry file
    writeFileSync(entryFile, testCase.code);

    try {
      // Build with Vite
      await build({
        root: testDir,
        build: {
          outDir,
          lib: {
            entry: entryFile,
            formats: ['es'],
            fileName: () => 'bundle.js',
          },
          rollupOptions: {
            external: ['@web-loom/store-core', '@web-loom/event-bus-core'],
          },
          minify: 'terser',
          write: true,
        },
        logLevel: 'error',
      });

      // Read and measure bundle
      const bundlePath = resolve(outDir, 'bundle.js');
      const bundleContent = readFileSync(bundlePath);
      const rawSize = bundleContent.length;
      const gzippedSize = gzipSync(bundleContent).length;

      results.push({
        name: testCase.name,
        rawSize,
        gzippedSize,
        rawKB: (rawSize / 1024).toFixed(2),
        gzippedKB: (gzippedSize / 1024).toFixed(2),
      });

      console.log(`✅ ${testCase.name.padEnd(25)} Raw: ${(rawSize / 1024).toFixed(2)} KB | Gzipped: ${(gzippedSize / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error(`❌ ${testCase.name} failed:`, error.message);
    }
  }

  // Clean up
  rmSync(testDir, { recursive: true, force: true });

  console.log('\n📊 Summary:');
  console.log('─'.repeat(60));

  const individualBehaviors = results.filter(r => r.name.endsWith('-only'));
  const allBehaviors = results.find(r => r.name === 'all-behaviors');

  if (individualBehaviors.length > 0) {
    const avgGzipped = individualBehaviors.reduce((sum, r) => sum + r.gzippedSize, 0) / individualBehaviors.length;
    console.log(`Average individual behavior size (gzipped): ${(avgGzipped / 1024).toFixed(2)} KB`);
    
    const maxGzipped = Math.max(...individualBehaviors.map(r => r.gzippedSize));
    console.log(`Largest individual behavior size (gzipped): ${(maxGzipped / 1024).toFixed(2)} KB`);

    // Check if all behaviors are under 2KB gzipped
    const allUnder2KB = individualBehaviors.every(r => r.gzippedSize < 2048);
    if (allUnder2KB) {
      console.log('✅ All individual behaviors are under 2KB gzipped');
    } else {
      console.log('⚠️  Some behaviors exceed 2KB gzipped');
      individualBehaviors.filter(r => r.gzippedSize >= 2048).forEach(r => {
        console.log(`   - ${r.name}: ${r.gzippedKB} KB`);
      });
    }
  }

  if (allBehaviors) {
    console.log(`\nAll behaviors combined (gzipped): ${allBehaviors.gzippedKB} KB`);
    
    // Check if under 20KB
    if (allBehaviors.gzippedSize < 20480) {
      console.log('✅ Combined size is under 20KB gzipped');
    } else {
      console.log('⚠️  Combined size exceeds 20KB gzipped');
    }
  }

  console.log('\n✨ Tree-shaking test complete!');
}

testTreeShaking().catch(console.error);
