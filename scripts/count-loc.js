#!/usr/bin/env node
/**
 * Lines of Code Counter for Web Loom Monorepo
 *
 * Counts source code vs test code, excluding:
 * - node_modules, dist, build, coverage
 * - Config files (.json, .js config, .md, etc.)
 * - Generated files
 *
 * Run: npm run count-loc
 */

const fs = require('fs');
const path = require('path');

// Files/directories to skip
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  '.git',
  '.vscode',
  '.idea',
  'public',
  'assets',
  '.angular',
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts.timestamp',
  'vitest.config.js',
]);

// Config file patterns to skip
const CONFIG_PATTERNS = [
  /\.config\.(js|ts|mjs|cjs)$/,
  /vite\.config\.ts$/,
  /vitest\.config\.(js|ts)$/,
  /eslint(rc)?\.c?js$/,
  /\.eslintrc\.json$/,
  /prettier(rc)?\.json$/,
  /jest\.config\.(js|ts)$/,
  /webpack\.config\.(js|ts)$/,
  /rollup\.config\.(js|ts)$/,
  /turbo\.json$/,
  /tsconfig.*\.json$/,
];

// Extensions to count as source code
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte']);

// Test file patterns
const TEST_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__\//,
];

function isSkipDir(name) {
  return SKIP_DIRS.has(name) || name.startsWith('.');
}

function isSkipFile(name) {
  if (SKIP_FILES.has(name)) return true;
  if (name.endsWith('.md')) return true;
  if (name.endsWith('.json') && !name.includes('package.json')) return true;
  if (name.endsWith('.lock')) return true;
  return CONFIG_PATTERNS.some(pattern => pattern.test(name));
}

function isTestFile(filePath) {
  return TEST_PATTERNS.some(pattern => pattern.test(filePath));
}

function isSourceFile(filePath) {
  const ext = path.extname(filePath);
  return SOURCE_EXTENSIONS.has(ext);
}

function countLinesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let blanks = 0;
  let comments = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      blanks++;
      continue;
    }

    // Check for block comments
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      comments++;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      comments++;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    // Single line comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      comments++;
      continue;
    }
  }

  const code = lines.length - blanks - comments;

  return {
    lines: lines.length,
    blanks,
    comments,
    code,
  };
}

function createEmptyStats() {
  return { files: 0, lines: 0, blanks: 0, comments: 0, code: 0 };
}

function addStats(a, b) {
  a.files++;
  a.lines += b.lines;
  a.blanks += b.blanks;
  a.comments += b.comments;
  a.code += b.code;
}

function scanDirectory(dirPath, stats) {
  try {
    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!isSkipDir(entry)) {
            scanDirectory(fullPath, stats);
          }
          continue;
        }

        if (!stat.isFile()) continue;
        if (isSkipFile(entry)) continue;
        if (!isSourceFile(fullPath)) continue;

        const fileStats = countLinesInFile(fullPath);
        const isTest = isTestFile(fullPath);

        if (isTest) {
          addStats(stats.tests, fileStats);
        } else {
          addStats(stats.source, fileStats);
        }

        addStats(stats.total, fileStats);
      } catch (err) {
        // Skip files we can't read
        continue;
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
}

function createCategoryStats() {
  return {
    source: createEmptyStats(),
    tests: createEmptyStats(),
    total: createEmptyStats(),
  };
}

function mergeStats(target, source) {
  target.files += source.files;
  target.lines += source.lines;
  target.blanks += source.blanks;
  target.comments += source.comments;
  target.code += source.code;
}

function generateReport(rootDir) {
  const packagesDir = path.join(rootDir, 'packages');
  const appsDir = path.join(rootDir, 'apps');

  const report = {
    packages: {},
    apps: {},
    totals: {
      packages: createCategoryStats(),
      apps: createCategoryStats(),
      overall: createCategoryStats(),
    },
  };

  // Scan packages
  try {
    const packages = fs.readdirSync(packagesDir);
    for (const pkg of packages) {
      const pkgPath = path.join(packagesDir, pkg);
      if (!fs.statSync(pkgPath).isDirectory()) continue;
      if (isSkipDir(pkg)) continue;

      const stats = createCategoryStats();
      scanDirectory(pkgPath, stats);
      report.packages[pkg] = stats;

      mergeStats(report.totals.packages.source, stats.source);
      mergeStats(report.totals.packages.tests, stats.tests);
      mergeStats(report.totals.packages.total, stats.total);
    }
  } catch (err) {
    console.error('Error scanning packages:', err.message);
  }

  // Scan apps
  try {
    const apps = fs.readdirSync(appsDir);
    for (const app of apps) {
      const appPath = path.join(appsDir, app);
      if (!fs.statSync(appPath).isDirectory()) continue;
      if (isSkipDir(app)) continue;

      const stats = createCategoryStats();
      scanDirectory(appPath, stats);
      report.apps[app] = stats;

      mergeStats(report.totals.apps.source, stats.source);
      mergeStats(report.totals.apps.tests, stats.tests);
      mergeStats(report.totals.apps.total, stats.total);
    }
  } catch (err) {
    console.error('Error scanning apps:', err.message);
  }

  // Calculate overall totals
  mergeStats(report.totals.overall.source, report.totals.packages.source);
  mergeStats(report.totals.overall.source, report.totals.apps.source);
  mergeStats(report.totals.overall.tests, report.totals.packages.tests);
  mergeStats(report.totals.overall.tests, report.totals.apps.tests);
  mergeStats(report.totals.overall.total, report.totals.packages.total);
  mergeStats(report.totals.overall.total, report.totals.apps.total);

  return report;
}

function formatNumber(num) {
  return num.toLocaleString();
}

function printStats(label, stats) {
  const pct = stats.lines > 0 ? ((stats.code / stats.lines) * 100).toFixed(1) : '0.0';
  console.log(
    `${label.padEnd(35)} ${formatNumber(stats.files).padStart(6)} files  ` +
    `${formatNumber(stats.lines).padStart(8)} lines  ` +
    `${formatNumber(stats.code).padStart(8)} code  ` +
    `${formatNumber(stats.comments).padStart(8)} comments  ` +
    `${formatNumber(stats.blanks).padStart(8)} blanks  ` +
    `${pct.padStart(5)}%`
  );
}

function printReport(report) {
  console.log('\n' + '='.repeat(120));
  console.log('WEB LOOM - LINES OF CODE REPORT');
  console.log('Generated:', new Date().toLocaleString());
  console.log('='.repeat(120));

  // Overall Summary
  console.log('\n📊 OVERALL SUMMARY\n');
  printStats('Source Code', report.totals.overall.source);
  printStats('Test Code', report.totals.overall.tests);
  console.log('-'.repeat(120));
  printStats('TOTAL', report.totals.overall.total);

  const testCoverage = report.totals.overall.source.code > 0
    ? ((report.totals.overall.tests.code / report.totals.overall.source.code) * 100).toFixed(1)
    : '0.0';
  console.log(`\nTest to Source Ratio: ${testCoverage}% (${formatNumber(report.totals.overall.tests.code)} test lines / ${formatNumber(report.totals.overall.source.code)} source lines)`);

  // Packages
  console.log('\n📦 PACKAGES\n');
  printStats('All Packages - Source', report.totals.packages.source);
  printStats('All Packages - Tests', report.totals.packages.tests);
  console.log('-'.repeat(120));

  const sortedPackages = Object.entries(report.packages)
    .sort(([, a], [, b]) => b.total.code - a.total.code);

  for (const [name, stats] of sortedPackages) {
    if (stats.total.code === 0) continue;
    console.log(`\n  ${name}:`);
    printStats('    Source', stats.source);
    printStats('    Tests', stats.tests);
  }

  // Apps
  console.log('\n\n🚀 APPS\n');
  printStats('All Apps - Source', report.totals.apps.source);
  printStats('All Apps - Tests', report.totals.apps.tests);
  console.log('-'.repeat(120));

  const sortedApps = Object.entries(report.apps)
    .sort(([, a], [, b]) => b.total.code - a.total.code);

  for (const [name, stats] of sortedApps) {
    if (stats.total.code === 0) continue;
    console.log(`\n  ${name}:`);
    printStats('    Source', stats.source);
    printStats('    Tests', stats.tests);
  }

  // Top Contributors
  console.log('\n\n🏆 TOP 10 LARGEST CODEBASES\n');
  const allProjects = [
    ...Object.entries(report.packages).map(([name, stats]) => ({ name: `packages/${name}`, stats })),
    ...Object.entries(report.apps).map(([name, stats]) => ({ name: `apps/${name}`, stats })),
  ]
    .sort((a, b) => b.stats.source.code - a.stats.source.code)
    .slice(0, 10);

  for (let i = 0; i < allProjects.length; i++) {
    const { name, stats } = allProjects[i];
    console.log(`${(i + 1).toString().padStart(2)}. ${name.padEnd(40)} ${formatNumber(stats.source.code).padStart(8)} lines of code`);
  }

  console.log('\n' + '='.repeat(120) + '\n');
}

// Main execution
const rootDir = process.cwd();
console.log('Analyzing Web Loom codebase...\n');

const report = generateReport(rootDir);
printReport(report);

// Export to JSON if --json flag is provided
if (process.argv.includes('--json')) {
  const outputPath = path.join(rootDir, 'loc-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ JSON report saved to: ${outputPath}\n`);
}
