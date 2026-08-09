import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import plugin from './index.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
});

const importPreamble = `import { compile } from '@web-loom/template-core';\n`;

ruleTester.run('no-invalid-expression', plugin.rules['no-invalid-expression'], {
  valid: [`${importPreamble}export const t = compile(\`<p>{{ title }}</p>\`);`],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`<p>{{ count + 1 }}</p>\`);`,
      errors: [{ messageId: 'reported' }],
    },
  ],
});

ruleTester.run('no-raw-html', plugin.rules['no-raw-html'], {
  valid: [`${importPreamble}export const t = compile(\`<p>{{ title }}</p>\`);`],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`<div>{{{ html }}}</div>\`);`,
      errors: [{ messageId: 'reported' }],
    },
  ],
});

ruleTester.run('no-unsupported-modifier', plugin.rules['no-unsupported-modifier'], {
  valid: [`${importPreamble}export const t = compile(\`<button on:click.prevent="save"></button>\`);`],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`<button on:click.prevent.passive="save"></button>\`);`,
      errors: [{ messageId: 'reported' }],
    },
  ],
});

ruleTester.run('no-missing-partial', plugin.rules['no-missing-partial'], {
  valid: [
    {
      code: `${importPreamble}export const t = compile(\`{{> card}}\`);`,
      settings: { 'template-core': { partials: { card: 'card.ts' } } },
    },
  ],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`{{> missing}}\`);`,
      settings: { 'template-core': { partials: { card: 'card.ts' } } },
      errors: [{ messageId: 'reported' }],
    },
  ],
});

ruleTester.run('no-unsafe-url', plugin.rules['no-unsafe-url'], {
  valid: [`${importPreamble}export const t = compile(\`<a href="https://example.com">ok</a>\`);`],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`<a :href="'javascript:alert(1)'">bad</a>\`);`,
      errors: [{ messageId: 'reported' }],
    },
  ],
});
