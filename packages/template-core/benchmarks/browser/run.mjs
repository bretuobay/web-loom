import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import { startStaticServer } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..', '..');
const templateCoreDist = join(packageRoot, 'dist');
const signalsCoreDist = resolve(packageRoot, '..', 'signals-core', 'dist');
const resultsDir = join(here, '.results');

const WARMUP_ITERATIONS = 3;
const TIMED_ITERATIONS = 20;

// Thresholds are a reasoned, not formally PRD-specified, extension of PRD §10's targets:
// mount/hydration are held to the same class as §10's "initial render < 50ms" target;
// disposal/keyed-list-swap are held to the same class as §10's "single-signal update < 16ms"
// target. This script always exits 0 regardless of outcome — it's a report, not a CI gate,
// matching the jsdom benches' framing in benchmarks/todo.bench.ts.
const SCENARIOS = [
  { name: 'mount (todo, 10 items)', key: 'mount', thresholdMs: 50 },
  { name: 'update (single signal write)', key: 'update', thresholdMs: 16 },
  { name: 'keyed-list swap (2 of 1000 rows)', key: 'keyed-list-swap', thresholdMs: 16 },
  { name: 'hydration (todo, 10 items)', key: 'hydration', thresholdMs: 50, needsSsrHtml: true },
  { name: 'disposal (table, 1000 rows)', key: 'disposal', thresholdMs: 16 },
];

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function renderSsrTodoHtml() {
  const ssrModuleUrl = new URL(`file://${join(templateCoreDist, 'ssr.es.js')}`);
  const { compile } = await import(ssrModuleUrl);
  const TODO_TEMPLATE = `
        <div>
          <h1>{{ title$ }}</h1>
          <ul>
            {{#each todos$ key=id}}
              <li class:done="done">{{ text }}</li>
            {{/each}}
          </ul>
        </div>
      `;
  const todos = Array.from({ length: 10 }, (_, i) => ({ id: String(i), text: `Task ${i}`, done: i % 3 === 0 }));
  return compile(TODO_TEMPLATE).renderToString({ title$: 'Todos', todos$: todos });
}

async function main() {
  console.log('Building? Run `npm run build` first if dist/ is missing or stale.');

  const ssrHtml = await renderSsrTodoHtml();
  const server = await startStaticServer({ templateCoreDist, signalsCoreDist, fixtureDir: here });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${server.url}/fixture.html`);
    await page.waitForFunction(() => window.__ready === true);

    const results = [];
    for (const scenario of SCENARIOS) {
      const payload = scenario.needsSsrHtml ? ssrHtml : undefined;

      for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        await page.evaluate(([key, arg]) => window.__runScenario(key, arg), [scenario.key, payload]);
      }

      const samples = [];
      for (let i = 0; i < TIMED_ITERATIONS; i++) {
        const { ms } = await page.evaluate(([key, arg]) => window.__runScenario(key, arg), [scenario.key, payload]);
        samples.push(ms);
      }

      const sorted = samples.slice().sort((a, b) => a - b);
      const median = percentile(sorted, 50);
      const p95 = percentile(sorted, 95);
      const withinThreshold = median <= scenario.thresholdMs;
      results.push({
        name: scenario.name,
        unit: 'ms',
        median: Number(median.toFixed(3)),
        p95: Number(p95.toFixed(3)),
        samples: samples.length,
        thresholdMs: scenario.thresholdMs,
        withinThreshold,
      });
    }

    const browserVersion = browser.version();
    const report = {
      recordedAt: new Date().toISOString(),
      os: `${os.type()} ${os.release()}`,
      nodeVersion: process.version,
      browser: 'chromium',
      browserVersion,
      cpu: `${os.cpus()[0]?.model ?? 'unknown'} x${os.cpus().length}`,
      scenarios: results,
    };

    await mkdir(resultsDir, { recursive: true });
    await writeFile(join(resultsDir, 'latest.json'), JSON.stringify(report, null, 2));

    console.log('\nBrowser benchmark results (Chromium, real browser — see benchmarks/browser/.results/latest.json):\n');
    console.table(
      results.map((r) => ({
        scenario: r.name,
        'median (ms)': r.median,
        'p95 (ms)': r.p95,
        'threshold (ms)': r.thresholdMs,
        ok: r.withinThreshold ? 'PASS' : 'WARN',
      })),
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  // Report-only tool, per benchmarks/todo.bench.ts's framing: still exit 0 so it never
  // blocks a script chain, but surface the failure loudly.
  process.exitCode = 0;
});
