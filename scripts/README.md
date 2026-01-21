# Scripts

Utility scripts for the Web Loom monorepo.

## Lines of Code Counter

Count lines of source code vs test code across the entire monorepo.

### Quick Start

```bash
# Install dependencies first
npm install

# 🌐 RECOMMENDED: Interactive HTML visualizer (opens in browser)
npm run count-loc:visualize

# Run the LOC counter (console output)
npm run count-loc

# Export to JSON
npm run count-loc:json

# Use cloc/tokei (if installed)
npm run count-loc:cloc
```

### Features

The LOC counter:

✅ **Separates source from tests**

- Automatically detects `.test.ts`, `.spec.ts`, `__tests__/` files
- Reports source vs test code separately

✅ **Excludes non-code files**

- `node_modules`, `dist`, `build`, `.next`, `coverage`
- Config files (`.config.js`, `tsconfig.json`, etc.)
- Markdown files, JSON, lock files
- Assets (images, fonts, etc.)

✅ **Counts real code**

- Lines of code (excluding blanks and comments)
- Files, blanks, comments tracked separately
- Code density percentage

✅ **Organized reports**

- Breakdown by packages and apps
- Top 10 largest codebases
- Test-to-source ratio
- Formatted, human-readable output

### Four Implementations

#### 1. HTML Visualizer (Recommended) 🌐

**Command:** `npm run count-loc:visualize`

**Features:**

- Beautiful, interactive HTML dashboard
- Chart.js visualizations (pie charts, bar charts)
- Automatically opens in your default browser
- Color-coded test coverage badges
- Responsive design for mobile and desktop
- Zero configuration required

**What You Get:**

- **Distribution Chart**: Visual breakdown of code vs comments vs blanks
- **Source vs Tests Chart**: Compare source and test code across packages and apps
- **Top 10 Packages Chart**: Horizontal bar chart of largest packages
- **Top 10 Apps Chart**: Horizontal bar chart of largest apps
- **Interactive Tables**: Sortable tables with coverage percentages
- **Summary Cards**: Key metrics at a glance

**Perfect For:**

- Quick project overview
- Sharing with stakeholders
- Team presentations
- Visual code metrics tracking

#### 2. Console Version

**Command:** `npm run count-loc`

**Pros:**

- No external dependencies
- Consistent cross-platform
- Detailed breakdowns
- JSON export option

**Example Output:**

```
========================================================================================================================
WEB LOOM - LINES OF CODE REPORT
Generated: 1/11/2026, 3:00:00 AM
========================================================================================================================

📊 OVERALL SUMMARY

Source Code                            142 files    45,231 lines    38,450 code     3,821 comments     2,960 blanks   85.0%
Test Code                               38 files     8,942 lines     7,230 code       892 comments       820 blanks   80.9%
------------------------------------------------------------------------------------------------------------------------
TOTAL                                  180 files    54,173 lines    45,680 code     4,713 comments     3,780 blanks   84.3%

Test to Source Ratio: 18.8% (7,230 test lines / 38,450 source lines)

📦 PACKAGES
...
```

#### 3. Shell Script (cloc/tokei)

**Command:** `npm run count-loc:cloc`

**Requirements:**

- `cloc` or `tokei` installed

```bash
# macOS
brew install cloc

# Ubuntu/Debian
sudo apt install cloc

# Rust (tokei - faster alternative)
cargo install tokei
```

**Pros:**

- Industry-standard tools
- Very fast on large codebases
- Language detection

#### 4. JSON Export

**Command:** `npm run count-loc:json`

**Output:** `loc-report.json`

Use for:

- CI/CD metrics
- Trend analysis over time
- Custom reporting/visualization

**Example JSON:**

```json
{
  "packages": {
    "mvvm-core": {
      "source": { "files": 15, "lines": 2340, "code": 1987, ... },
      "tests": { "files": 8, "lines": 892, "code": 721, ... },
      "total": { "files": 23, "lines": 3232, "code": 2708, ... }
    }
  },
  "totals": { ... }
}
```

### What's Counted

#### Source Code Extensions

- `.ts` - TypeScript
- `.tsx` - TypeScript React
- `.js` - JavaScript
- `.jsx` - JavaScript React
- `.vue` - Vue components
- `.svelte` - Svelte components

#### Test File Patterns

- `*.test.ts`, `*.test.tsx`
- `*.spec.ts`, `*.spec.tsx`
- Files in `__tests__/` directories

#### Excluded Directories

```
node_modules/
dist/
build/
.next/
coverage/
.turbo/
.git/
.angular/
public/
assets/
```

#### Excluded Files

- Config files: `*.config.js`, `vite.config.ts`, `tsconfig.json`
- Documentation: `*.md`
- Data files: `*.json` (except package.json)
- Lock files: `package-lock.json`, `yarn.lock`
- Assets: images, fonts, etc.

### Use Cases

#### 1. Project Status Reports

```bash
npm run count-loc > loc-report.txt
# Share loc-report.txt with stakeholders
```

#### 2. CI/CD Metrics

```bash
npm run count-loc:json
# Upload loc-report.json to metrics dashboard
```

#### 3. Code Review

```bash
# Before major refactor
npm run count-loc:json
cp loc-report.json loc-before.json

# After refactor
npm run count-loc:json
# Compare loc-before.json vs loc-report.json
```

#### 4. Test Coverage Awareness

The test-to-source ratio helps identify undertested areas:

```
Test to Source Ratio: 18.8%
```

Target: 50%+ for critical packages

### Interpreting Results

#### Good Code Density

```
code: 85.0%  ✅ (Most lines are code, not comments/blanks)
```

Target: 75-90%

#### Test Coverage Goal

```
Test to Source Ratio: 18.8%  ⚠️ (Needs more tests)
Test to Source Ratio: 52.3%  ✅ (Good coverage)
```

Target: 40-60% (1 test line per 2 source lines)

#### Large Files Warning

If individual files exceed 500 lines of code, consider refactoring.

### Adding to CI/CD

**.github/workflows/metrics.yml:**

```yaml
name: Code Metrics

on:
  push:
    branches: [main]
  pull_request:

jobs:
  loc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run count-loc:json
      - uses: actions/upload-artifact@v4
        with:
          name: loc-report
          path: loc-report.json
```

### Troubleshooting

#### "tsx: command not found"

```bash
npm install
```

The `tsx` package is listed in devDependencies.

#### "Permission denied"

```bash
chmod +x scripts/count-loc.sh
```

#### Different results between TypeScript and cloc

The TypeScript version counts code more conservatively (excludes more config files). Both are correct, just different methodologies.

### Performance

| Codebase Size | TypeScript | cloc | tokei |
| ------------- | ---------- | ---- | ----- |
| Small (<10K)  | ~1s        | ~1s  | <1s   |
| Medium (50K)  | ~3s        | ~2s  | <1s   |
| Large (100K+) | ~8s        | ~4s  | ~1s   |

For very large codebases, consider using `tokei` (fastest) or `cloc`.

### Extending

#### Add New File Extensions

Edit `scripts/count-loc.ts`:

```typescript
const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.vue',
  '.svelte',
  '.rs',
  '.go',
  '.py', // Add your languages
]);
```

#### Custom Exclusions

```typescript
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'my-custom-dir', // Add custom directories
]);
```

### Related Commands

```bash
npm run build        # Build all packages
npm run test         # Run all tests
npm run check-types  # TypeScript type checking
npm run count-loc    # Count lines of code
```

## Demo Runner Helpers

The `scripts/dev-helper` folder now holds CLI helpers that orchestrate the demo API + UI ports without manually juggling terminals.

- `npm run demo:start [--frontends=mvvm-react,...|all] [--dry-run]` boots `apps/api` and the requested `mvvm-*` frontends, prints a port summary, and adds a friendly reminder that the data is seeded for demos.
- `npm run demo:task-flow [--dry-run]` pairs `task-flow-api` and `task-flow-ui` so the Task Flow experience always has its matching backend in the same terminal.

Both helpers surface port assignments before starting and point you to `PORT_ASSIGNMENTS.md` if you need to add or move ports.

The demo runner also checks `npm_config_frontends`, so the frontend list still works when npm complains about "Unknown env config frontends", but to avoid the warning, prefer running it as `npm run demo:start -- --frontends=...`.
