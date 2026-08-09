import { describe, expect, it } from 'vitest';
import { collectTemplateLintIssues } from './lint-file.js';

describe('collectTemplateLintIssues', () => {
  const importPreamble = `import { compile } from '@web-loom/template-core';\n`;

  it('reports invalid expressions at the compile call site', () => {
    const code = `${importPreamble}export const broken = compile(\`<p>{{ count + 1 }}</p>\`);`;
    const issues = collectTemplateLintIssues('/app/broken.ts', code, {});
    expect(issues.some((issue) => issue.diagnosticCode === 'INVALID_EXPRESSION')).toBe(true);
    expect(issues[0]?.line).toBe(2);
  });

  it('reports missing partials when a manifest is configured', () => {
    const code = `${importPreamble}export const page = compile(\`{{> card}}\`);`;
    const issues = collectTemplateLintIssues('/app/page.ts', code, {
      partials: { header: 'src/header.ts' },
      strictPartials: true,
    });
    expect(issues).toEqual([
      expect.objectContaining({ diagnosticCode: 'MISSING_PARTIAL', severity: 'error' }),
    ]);
  });

  it('skips non-literal compile sources', () => {
    const code = `${importPreamble}import { source } from './source';\nexport const t = compile(source);`;
    expect(collectTemplateLintIssues('/app/dynamic.ts', code, {})).toEqual([]);
  });
});
