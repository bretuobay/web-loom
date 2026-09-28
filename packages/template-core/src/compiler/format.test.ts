import { describe, expect, it } from 'vitest';
import { formatTemplate } from './format.js';

describe('formatTemplate', () => {
  it('indents nested blocks and tags', () => {
    const source = `<div>{{#if show}}<p>{{ title$ }}</p>{{/if}}</div>`;
    const result = formatTemplate(source);
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe(
      `<div>
  {{#if show}}
    <p>
      {{ title$ }}
    </p>
  {{/if}}
</div>
`,
    );
  });

  it('places partials and else branches on their own lines', () => {
    const source = `<main>{{> header}}{{#each items key=this}}<span>{{ this }}</span>{{else}}<p>Empty</p>{{/each}}</main>`;
    const result = formatTemplate(source);
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe(
      `<main>
  {{> header}}
  {{#each items key=this}}
    <span>
      {{ this }}
    </span>
    {{else}}
    <p>
      Empty
    </p>
  {{/each}}
</main>
`,
    );
  });

  it('places block partials and slots on their own lines', () => {
    const source = `{{#> card title=name}}Hello{{#slot footer}}<button>Edit</button>{{/slot}}{{/card}}`;
    const result = formatTemplate(source);
    expect(result.ok).toBe(true);
    expect(result.formatted).toBe(
      `{{#> card title=name}}
  Hello
  {{#slot footer}}
    <button>
      Edit
    </button>
  {{/slot}}
{{/card}}
`,
    );
  });

  it('preserves directive attributes and inline expressions', () => {
    const source = `<button on:click="save" class:active="isActive$" :disabled="busy$">{{ label$ }}</button>`;
    const result = formatTemplate(source);
    expect(result.ok).toBe(true);
    expect(result.formatted).toContain('on:click="save"');
    expect(result.formatted).toContain('class:active="isActive$"');
    expect(result.formatted).toContain(':disabled="busy$"');
    expect(result.formatted).toContain('{{ label$ }}');
  });

  it('preserves script and style interiors verbatim', () => {
    const source = `<div><script>
  const x = 1;
</script><style>
  .a { color: red; }
</style></div>`;
    const result = formatTemplate(source);
    expect(result.ok).toBe(true);
    expect(result.formatted).toContain(`<script>
  const x = 1;
</script>`);
    expect(result.formatted).toContain(`.a { color: red; }`);
  });

  it('returns diagnostics without formatted output on syntax errors', () => {
    const result = formatTemplate('{{#if a}}A');
    expect(result.ok).toBe(false);
    expect(result.formatted).toBeUndefined();
    expect(result.diagnostics[0]).toMatchObject({
      code: 'INVALID_TEMPLATE',
      severity: 'error',
    });
  });

  it('returns analyzer warnings alongside formatted output', () => {
    const result = formatTemplate('<div>{{{ html }}}</div>');
    expect(result.ok).toBe(true);
    expect(result.formatted).toBeDefined();
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'RAW_HTML_UNSANITIZED', severity: 'warning' }),
    ]);
  });

  it('is idempotent and reports unchanged on second pass', () => {
    const source = `<section>{{#if ok}}<p>Yes</p>{{/if}}</section>`;
    const first = formatTemplate(source);
    expect(first.ok).toBe(true);
    const second = formatTemplate(first.formatted!);
    expect(second.ok).toBe(true);
    expect(second.formatted).toBe(first.formatted);
    expect(second.unchanged).toBe(true);
  });

  it('is idempotent when text nodes were split across lines on the first pass', () => {
    const once = formatTemplate(`<div>{{#if ok}}<p>Yes</p>{{/if}}</div>`);
    expect(once.ok).toBe(true);
    const twice = formatTemplate(once.formatted!);
    expect(twice.formatted).toBe(once.formatted);
    expect(twice.unchanged).toBe(true);
  });
});
