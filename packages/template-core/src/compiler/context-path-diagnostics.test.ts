import { describe, expect, it } from 'vitest';
import { analyzeTemplate } from './analyze.js';

const KEYS = ['sensors', 'form', 'navigate', 'formatTimestamp'];

function unknownRoots(source: string, contextKeys: string[] = KEYS): string[] {
  return analyzeTemplate(source, { contextKeys })
    .diagnostics.filter((d) => d.code === 'UNKNOWN_CONTEXT_PATH')
    .map((d) => (d.details as { rootSegment: string }).rootSegment);
}

describe('UNKNOWN_CONTEXT_PATH static analysis', () => {
  it('flags misspelled roots in interpolation, attributes, and bind targets', () => {
    expect(unknownRoots('<p>{{ sensrs.data$ }}</p>')).toEqual(['sensrs']);
    expect(unknownRoots('<p :title="frm.name$"></p>')).toEqual(['frm']);
    expect(unknownRoots('<input bind:value="frm.name$" />')).toEqual(['frm']);
  });

  it('accepts declared keys, literals, and this-paths', () => {
    expect(unknownRoots('<p class:on="sensors.data$">{{ formatTimestamp(form.name$) }} {{ this }}</p>')).toEqual([]);
  });

  it('checks if/switch conditions and branch bodies in root scope', () => {
    expect(unknownRoots('{{#if loadin$}}<p>{{ missing }}</p>{{/if}}')).toEqual(['loadin$', 'missing']);
    expect(unknownRoots('{{#switch sensors.mode}}{{#case "a"}}<p>{{ bad }}</p>{{/case}}{{/switch}}')).toEqual(['bad']);
  });

  it('checks the each source and else branch but not the item-scoped body', () => {
    const source = '{{#each sensrs.data$ key=id}}<p>{{ label }}</p>{{else}}<p>{{ empty }}</p>{{/each}}';
    expect(unknownRoots(source)).toEqual(['sensrs', 'empty']);
  });

  it('skips bare event handlers and actions but checks call-form arguments', () => {
    expect(unknownRoots('<button on:click="navigate">x</button>')).toEqual([]);
    expect(unknownRoots('<button on:click="navigate(itm)">x</button>')).toEqual(['itm']);
    expect(unknownRoots('<canvas use:chart="renderChart"></canvas>')).toEqual([]);
  });

  it('is disabled when contextKeys is not provided', () => {
    const result = analyzeTemplate('<p>{{ anything }}</p>', {});
    expect(result.diagnostics.filter((d) => d.code === 'UNKNOWN_CONTEXT_PATH')).toEqual([]);
  });
});
