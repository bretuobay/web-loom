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

ruleTester.run('no-invalid-partial-props', plugin.rules['no-invalid-partial-props'], {
  valid: [
    {
      code: `${importPreamble}export const t = compile(\`{{> card count=n href=path}}\`);`,
      settings: {
        'template-core': {
          partials: { card: 'card.ts' },
          partialProps: { card: ['count', 'href'] },
        },
      },
    },
    `${importPreamble}export const t = compile(\`{{> card count=n}}\`);`,
  ],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`{{> card count=n}}\`);`,
      settings: {
        'template-core': {
          partials: { card: 'card.ts' },
          partialProps: { card: ['count', 'href'] },
        },
      },
      errors: [{ messageId: 'reported' }],
    },
    {
      code: `${importPreamble}export const t = compile(\`{{> card count=n extra=x}}\`);`,
      settings: {
        'template-core': {
          partials: { card: 'card.ts' },
          partialProps: { card: ['count'] },
        },
      },
      errors: [{ messageId: 'reported' }],
    },
  ],
});

ruleTester.run('no-unknown-context-path', plugin.rules['no-unknown-context-path'], {
  valid: [
    {
      code: `${importPreamble}export const t = compile(\`<p>{{ sensors.data$ }}</p>\`);`,
      settings: { 'template-core': { contextKeys: ['sensors'] } },
    },
    // Without a contextKeys manifest the rule stays inert.
    `${importPreamble}export const t = compile(\`<p>{{ anything }}</p>\`);`,
    {
      // Each-item bodies are item-scoped and never checked.
      code: `${importPreamble}export const t = compile(\`{{#each sensors.data$ key=id}}<p>{{ label }}</p>{{/each}}\`);`,
      settings: { 'template-core': { contextKeys: ['sensors'] } },
    },
  ],
  invalid: [
    {
      code: `${importPreamble}export const t = compile(\`<p>{{ sensrs.data$ }}</p>\`);`,
      settings: { 'template-core': { contextKeys: ['sensors'] } },
      errors: [{ messageId: 'reported' }],
    },
  ],
});
