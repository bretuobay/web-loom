import { describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from './index.js';
import { registerPartial, unregisterPartial } from '../index.js';
import { createTemplateRegistry } from '../runtime/registry.js';

/** Resolves after a small random delay, to force interleaved scheduling across "concurrent" calls. */
function jitter<T>(fn: () => T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(fn()), Math.random() * 5));
}

describe('SSR request isolation', () => {
  it('does not cross-contaminate concurrent renders using distinct partial registries', async () => {
    const indices = Array.from({ length: 20 }, (_, i) => i);

    const results = await Promise.all(
      indices.map((i) =>
        jitter(() => {
          const registry = createTemplateRegistry({ card: `<b>${i}</b>` });
          const template = compile('{{> card}}', { registry });
          return { i, html: template.renderToString({}) };
        }),
      ),
    );

    for (const { i, html } of results) {
      expect(html).toContain(`<b>${i}</b>`);
      for (const other of indices) {
        if (other === i) continue;
        expect(html).not.toContain(`<b>${other}</b>`);
      }
    }
  });

  it('does not cross-fire concurrent diagnostics callbacks', async () => {
    const indices = Array.from({ length: 20 }, (_, i) => i);
    const spies = indices.map(() => vi.fn());

    await Promise.all(
      indices.map((i) =>
        jitter(() => {
          const missing = i % 2 === 0;
          const source = missing ? '{{> missing}}' : '{{> present}}';
          const template = compile(source, {
            partials: missing ? {} : { present: 'ok' },
            diagnostics: { warn: spies[i] },
          });
          return template.renderToString({});
        }),
      ),
    );

    for (const i of indices) {
      const missing = i % 2 === 0;
      if (missing) expect(spies[i]).toHaveBeenCalledTimes(1);
      else expect(spies[i]).not.toHaveBeenCalled();
    }
  });

  it('does not cross-contaminate concurrent ViewModels sharing one compiled template', async () => {
    const template = compile('<p>{{ value$ }}</p>');
    const indices = Array.from({ length: 20 }, (_, i) => i);

    const results = await Promise.all(
      indices.map((i) => jitter(() => template.renderToString({ value$: signal(String(i)) }))),
    );

    for (const [i, html] of results.entries()) {
      expect(html).toContain(`>${i}<`);
    }
  });

  it('never sees partials registered on the browser-only global registry', () => {
    registerPartial('leaky', '<b>leaked</b>');
    try {
      const html = compile('{{> leaky}}').renderToString({});
      expect(html).not.toContain('leaked');
      expect(html).toContain('loom:anchor');
    } finally {
      unregisterPartial('leaky');
    }
  });
});
