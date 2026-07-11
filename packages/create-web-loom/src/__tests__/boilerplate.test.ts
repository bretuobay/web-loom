import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { injectBoilerplate } from '../boilerplate.js';
import type { Framework, TemplateVariant } from '../detect.js';

const tempDirs: string[] = [];
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const templateRoot = join(packageRoot, 'src/templates');

function createProject(entryFile: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'create-web-loom-inject-'));
  tempDirs.push(dir);

  const fullEntry = join(dir, entryFile);
  mkdirSync(dirname(fullEntry), { recursive: true });
  writeFileSync(fullEntry, '// vite starter\n', 'utf8');
  writeFileSync(join(dir, 'package.json'), '{"name":"fixture"}\n', 'utf8');

  return dir;
}

function listFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path));
    } else {
      files.push(path);
    }
  }

  return files;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('injectBoilerplate', () => {
  const scenarios: Array<{ framework: Framework; variant: TemplateVariant; entry: string }> = [
    { framework: 'react', variant: 'ts', entry: 'src/App.tsx' },
    { framework: 'react', variant: 'js', entry: 'src/App.jsx' },
    { framework: 'preact', variant: 'ts', entry: 'src/app.tsx' },
    { framework: 'preact', variant: 'js', entry: 'src/app.jsx' },
    { framework: 'solid', variant: 'ts', entry: 'src/App.tsx' },
    { framework: 'solid', variant: 'js', entry: 'src/App.jsx' },
    { framework: 'vue', variant: 'ts', entry: 'src/App.vue' },
    { framework: 'vue', variant: 'js', entry: 'src/App.vue' },
    { framework: 'svelte', variant: 'ts', entry: 'src/App.svelte' },
    { framework: 'svelte', variant: 'js', entry: 'src/App.svelte' },
    { framework: 'lit', variant: 'ts', entry: 'src/my-element.ts' },
    { framework: 'lit', variant: 'js', entry: 'src/my-element.js' },
    { framework: 'vanilla', variant: 'ts', entry: 'src/main.ts' },
    { framework: 'vanilla', variant: 'js', entry: 'src/main.js' },
    { framework: 'qwik', variant: 'ts', entry: 'src/app.tsx' },
    { framework: 'qwik', variant: 'js', entry: 'src/app.jsx' },
  ];

  for (const scenario of scenarios) {
    it(`applies ${scenario.framework}/${scenario.variant} templates`, () => {
      const projectDir = createProject(scenario.entry);

      injectBoilerplate(projectDir, {
        framework: scenario.framework,
        variant: scenario.variant,
      });

      const entryPath = join(projectDir, scenario.entry);
      expect(existsSync(entryPath)).toBe(true);

      const entryText = readFileSync(entryPath, 'utf8');
      expect(entryText).toContain('Web Loom starter');
      expect(entryText).not.toContain('useObservable');

      expect(existsSync(join(projectDir, 'src/viewmodels/CounterViewModel.ts'))).toBe(true);
    });
  }

  it('copies renamed signal bridge files for framework templates', () => {
    const reactDir = createProject('src/App.tsx');
    injectBoilerplate(reactDir, { framework: 'react', variant: 'ts' });
    expect(existsSync(join(reactDir, 'src/hooks/useSignal.ts'))).toBe(true);

    const vueDir = createProject('src/App.vue');
    injectBoilerplate(vueDir, { framework: 'vue', variant: 'ts' });
    expect(existsSync(join(vueDir, 'src/composables/useSignal.ts'))).toBe(true);

    const solidDir = createProject('src/App.tsx');
    injectBoilerplate(solidDir, { framework: 'solid', variant: 'ts' });
    expect(existsSync(join(solidDir, 'src/hooks/useSignalValue.ts'))).toBe(true);
  });

  it('keeps source templates free of stale observable bridge patterns', () => {
    const stalePatterns = [
      'useObservable',
      'Observable',
      'rxjs',
      '.pipe(',
      '.unsubscribe(',
      'const sync =',
      'this.count.set',
      'readonly count = signal',
    ];

    const violations = listFiles(templateRoot).flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return stalePatterns
        .filter((pattern) => text.includes(pattern))
        .map((pattern) => `${file.replace(`${packageRoot}/`, '')}: ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  it('throws a clear error for unknown template targets', () => {
    const projectDir = createProject('src/main.ts');

    expect(() =>
      injectBoilerplate(projectDir, {
        framework: 'vanilla',
        variant: 'unknown' as TemplateVariant,
      }),
    ).toThrow(/No templates found/);
  });
});
