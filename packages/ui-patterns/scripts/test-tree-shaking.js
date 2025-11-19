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

// Test cases for individual pattern imports
const testCases = [
  {
    name: 'command-palette-only',
    code: `import { createCommandPalette } from '@web-loom/ui-patterns/patterns/command-palette';
const palette = createCommandPalette({ commands: [] });
console.log(palette);`,
  },
  {
    name: 'master-detail-only',
    code: `import { createMasterDetail } from '@web-loom/ui-patterns/patterns/master-detail';
const masterDetail = createMasterDetail({ items: [], getId: (i) => i.id });
console.log(masterDetail);`,
  },
  {
    name: 'modal-only',
    code: `import { createModal } from '@web-loom/ui-patterns/patterns/modal';
const modal = createModal();
console.log(modal);`,
  },
  {
    name: 'sidebar-shell-only',
    code: `import { createSidebarShell } from '@web-loom/ui-patterns/patterns/sidebar-shell';
const sidebar = createSidebarShell();
console.log(sidebar);`,
  },
  {
    name: 'tabbed-interface-only',
    code: `import { createTabbedInterface } from '@web-loom/ui-patterns/patterns/tabbed-interface';
const tabs = createTabbedInterface({ tabs: [] });
console.log(tabs);`,
  },
  {
    name: 'toast-queue-only',
    code: `import { createToastQueue } from '@web-loom/ui-patterns/patterns/toast-queue';
const toasts = createToastQueue();
console.log(toasts);`,
  },
  {
    name: 'wizard-only',
    code: `import { createWizard } from '@web-loom/ui-patterns/patterns/wizard';
const wizard = createWizard({ steps: [] });
console.log(wizard);`,
  },
  {
    name: 'all-patterns',
    code: `import { createCommandPalette, createMasterDetail, createModal, createSidebarShell, createTabbedInterface, createToastQueue, createWizard } from '@web-loom/ui-patterns';
const palette = createCommandPalette({ commands: [] });
const masterDetail = createMasterDetail({ items: [], getId: (i) => i.id });
const modal = createModal();
const sidebar = createSidebarShell();
const tabs = createTabbedInterface({ tabs: [] });
const toasts = createToastQueue();
const wizard = createWizard({ steps: [] });
console.log(palette, masterDetail, modal, sidebar, tabs, toasts, wizard);`,
  },
];

async function testTreeShaking() {
  console.log('🌲 Testing tree-shaking for @web-loom/ui-patterns\n');

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
            external: [
              '@web-loom/ui-core',
              '@web-loom/store-core',
              '@web-loom/event-bus-core',
            ],
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

  const individualPatterns = results.filter(r => r.name.endsWith('-only'));
  const allPatterns = results.find(r => r.name === 'all-patterns');

  if (individualPatterns.length > 0) {
    const avgGzipped = individualPatterns.reduce((sum, r) => sum + r.gzippedSize, 0) / individualPatterns.length;
    console.log(`Average individual pattern size (gzipped): ${(avgGzipped / 1024).toFixed(2)} KB`);
    
    const maxGzipped = Math.max(...individualPatterns.map(r => r.gzippedSize));
    console.log(`Largest individual pattern size (gzipped): ${(maxGzipped / 1024).toFixed(2)} KB`);
  }

  if (allPatterns) {
    console.log(`\nAll patterns combined (gzipped): ${allPatterns.gzippedKB} KB`);
    
    // Check if under 30KB
    if (allPatterns.gzippedSize < 30720) {
      console.log('✅ Combined size is under 30KB gzipped');
    } else {
      console.log('⚠️  Combined size exceeds 30KB gzipped');
    }
  }

  console.log('\n✨ Tree-shaking test complete!');
}

testTreeShaking().catch(console.error);
