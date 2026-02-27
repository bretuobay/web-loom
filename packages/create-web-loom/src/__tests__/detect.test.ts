import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectFramework, detectScaffold, detectTemplateVariant, type Framework } from '../detect.js';

const tempDirs: string[] = [];

function createProject(config: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  files?: Record<string, string>;
} = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'create-web-loom-detect-'));
  tempDirs.push(dir);

  const pkg = {
    name: 'fixture',
    dependencies: config.dependencies ?? {},
    devDependencies: config.devDependencies ?? {},
  };

  writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  for (const [relativePath, content] of Object.entries(config.files ?? {})) {
    const fullPath = join(dir, relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }

  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('detectFramework', () => {
  const cases: Array<{ framework: Framework; dependencies: Record<string, string> }> = [
    { framework: 'qwik', dependencies: { '@builder.io/qwik': '^1.0.0' } },
    { framework: 'solid', dependencies: { 'solid-js': '^1.0.0' } },
    { framework: 'preact', dependencies: { preact: '^10.0.0' } },
    { framework: 'react', dependencies: { react: '^19.0.0' } },
    { framework: 'vue', dependencies: { vue: '^3.0.0' } },
    { framework: 'lit', dependencies: { lit: '^3.0.0' } },
    { framework: 'svelte', dependencies: { svelte: '^5.0.0' } },
  ];

  for (const testCase of cases) {
    it(`detects ${testCase.framework}`, () => {
      const projectDir = createProject({ dependencies: testCase.dependencies });
      expect(detectFramework(projectDir)).toBe(testCase.framework);
    });
  }

  it('falls back to vanilla when no framework dependency is present', () => {
    const projectDir = createProject({ dependencies: { lodash: '^4.0.0' } });
    expect(detectFramework(projectDir)).toBe('vanilla');
  });

  it('uses priority order when multiple framework deps are present', () => {
    const projectDir = createProject({
      dependencies: {
        react: '^19.0.0',
        preact: '^10.0.0',
        'solid-js': '^1.0.0',
      },
    });

    expect(detectFramework(projectDir)).toBe('solid');
  });
});

describe('detectTemplateVariant', () => {
  it('detects ts when typescript dependency exists', () => {
    const projectDir = createProject({ devDependencies: { typescript: '^5.0.0' } });
    expect(detectTemplateVariant(projectDir)).toBe('ts');
  });

  it('detects ts when TypeScript entry files exist', () => {
    const projectDir = createProject({ files: { 'src/main.ts': 'console.log("x")' } });
    expect(detectTemplateVariant(projectDir)).toBe('ts');
  });

  it('detects js when JavaScript entry files exist', () => {
    const projectDir = createProject({ files: { 'src/App.jsx': 'export default function App() {}' } });
    expect(detectTemplateVariant(projectDir)).toBe('js');
  });

  it('defaults qwik to ts when no hints are present', () => {
    const projectDir = createProject({ dependencies: { '@builder.io/qwik': '^1.0.0' } });
    expect(detectTemplateVariant(projectDir, 'qwik')).toBe('ts');
  });
});

describe('detectScaffold', () => {
  it('throws for unrecognized scaffolds that do not match supported entrypoints', () => {
    const projectDir = createProject({
      dependencies: { alpinejs: '^3.14.0' },
      files: { 'src/entry.js': 'console.log("x")' },
    });

    expect(() => detectScaffold(projectDir)).toThrow(/Could not map the generated Vite scaffold/);
  });
});
