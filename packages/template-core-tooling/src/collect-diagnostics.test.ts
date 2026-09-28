/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { collectSourceLinkedDiagnostics } from './collect-diagnostics.js';
import { findCompileCalls } from './find-compile-calls.js';
import { linkTemplateDiagnosticToFile } from './source-linked-diagnostic.js';

const importPreamble = `import { compile } from '@web-loom/template-core';\n`;

describe('collectSourceLinkedDiagnostics', () => {
  it('maps template line/column to host file coordinates', () => {
    const code = `${importPreamble}export const broken = compile(\`<p>{{ count + 1 }}</p>\`);`;

    const diagnostics = collectSourceLinkedDiagnostics('/app/broken.ts', code);
    const invalid = diagnostics.find((d) => d.code === 'INVALID_EXPRESSION');
    expect(invalid).toBeDefined();
    expect(invalid!.line).toBe(2);
    const line2 = code.split('\n')[1]!;
    expect(invalid!.column).toBeGreaterThan(line2.indexOf('{{'));
  });

  it('reports missing partials with file-linked positions', () => {
    const code = `${importPreamble}export const page = compile(\`{{> card}}\`);`;

    const diagnostics = collectSourceLinkedDiagnostics('/app/page.ts', code, {
      partials: { header: 'src/header.ts' },
      strictPartials: true,
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 'MISSING_PARTIAL',
        severity: 'error',
        line: 2,
      }),
    ]);
  });

  it('reports missing hash-arg props when a props manifest is configured', () => {
    const code = `${importPreamble}export const page = compile(\`{{> card count=n}}\`);`;

    const diagnostics = collectSourceLinkedDiagnostics('/app/page.ts', code, {
      partials: { card: 'src/card.ts' },
      partialProps: { card: ['count', 'href'] },
      strictPartials: true,
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 'MISSING_PARTIAL_PROP',
        severity: 'error',
        line: 2,
      }),
    ]);
  });
});

describe('linkTemplateDiagnosticToFile', () => {
  it('falls back to compile call start when template span is missing', () => {
    const hostSource = `${importPreamble}export const t = compile(\`<p></p>\`);`;
    const { matches } = findCompileCalls(hostSource, 'x.ts', ['@web-loom/template-core']);
    expect(matches).toHaveLength(1);
    const linked = linkTemplateDiagnosticToFile({
      filePath: 'x.ts',
      hostSource,
      match: matches[0]!,
      diagnostic: { code: 'TEST', severity: 'warning', message: 'msg' },
    });
    expect(linked.line).toBe(2);
    expect(linked.column).toBeGreaterThan(0);
  });
});
