import { describe, expect, it, vi } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { compile } from './renderer.js';
import type { TemplateDiagnostic } from '../types.js';

function mountWithDiagnostics(source: string, context: object, dev = true) {
  const report = vi.fn<(diagnostic: TemplateDiagnostic) => void>();
  const container = document.createElement('div');
  const view = compile(source, {
    dev,
    name: 'spec',
    diagnostics: { report, warn: () => {}, error: () => {} },
  }).mount(container, context);
  return { report, container, view };
}

describe('dev-mode UNRESOLVED_CONTEXT_PATH diagnostic', () => {
  it('warns when a path root does not exist on the mounted context', () => {
    const { report, view } = mountWithDiagnostics('<p>{{ sensrs.count }}</p>', { sensors: { count: 3 } });

    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]![0]).toMatchObject({
      code: 'UNRESOLVED_CONTEXT_PATH',
      severity: 'warning',
      template: 'spec',
    });
    view.dispose();
  });

  it('reports each unknown root only once per mount', () => {
    const { report, view } = mountWithDiagnostics('<p>{{ missing }}</p><p>{{ missing }}</p>', {});

    expect(report).toHaveBeenCalledTimes(1);
    view.dispose();
  });

  it('stays silent for present keys holding null or undefined values', () => {
    const { report, view } = mountWithDiagnostics('<p>{{ data$.length }}</p>', {
      data$: signal<unknown[] | null>(null),
    });

    expect(report).not.toHaveBeenCalled();
    view.dispose();
  });

  it('stays silent for loop locals and item fields inside {{#each}}', () => {
    const { report, view } = mountWithDiagnostics(
      '<ul>{{#each items$ key=id}}<li>{{ @index }} {{ label }}</li>{{/each}}</ul>',
      { items$: signal([{ id: '1', label: 'one' }]) },
    );

    expect(report).not.toHaveBeenCalled();
    view.dispose();
  });

  it('stays silent for event handlers resolved through the scope chain', () => {
    const onSelect = vi.fn();
    const { report, container, view } = mountWithDiagnostics(
      '<ul>{{#each items$ key=id}}<li><button on:click="onSelect(this)">x</button></li>{{/each}}</ul>',
      { items$: signal([{ id: '1' }]), onSelect },
    );

    container.querySelector('button')!.click();
    expect(onSelect).toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
    view.dispose();
  });

  it('warns for unknown roots referenced inside {{#each}} item scopes', () => {
    const { report, view } = mountWithDiagnostics(
      '<ul>{{#each items$ key=id}}<li>{{ labell }}</li>{{/each}}</ul>',
      { items$: signal([{ id: '1', label: 'one' }]) },
    );

    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]![0]).toMatchObject({ code: 'UNRESOLVED_CONTEXT_PATH' });
    view.dispose();
  });

  it('is fully disabled without the dev option', () => {
    const { report, view } = mountWithDiagnostics('<p>{{ missing }}</p>', {}, false);

    expect(report).not.toHaveBeenCalled();
    view.dispose();
  });
});
