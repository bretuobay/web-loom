import { effect } from '@web-loom/signals-core';
import { evaluate } from '../runtime/evaluate.js';
import { reportDiagnostic } from '../runtime/diagnostics.js';
import type { DisposalBag } from '../runtime/disposal.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';

function stringify(value: unknown): string {
  return value == null ? '' : String(value);
}

/**
 * `{{ expr }}` text interpolation. Always applied via `textContent` — this
 * is what makes escaping automatic (Requirement 2.1/2.2): the DOM never
 * interprets the string as markup, so there is no separate "escape" step to
 * get wrong.
 */
export function bindText(
  record: Extract<BindingRecord, { kind: 'text' }>,
  node: Text,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const handle = effect(() => {
    const value = record.parts
      .map((part) => ('static' in part ? part.static : stringify(evaluate(part.expr, scope, ctx.helpers))))
      .join('');
    node.textContent = value;
  });
  bag.add(handle.dispose);
}

function parseHtmlFragment(html: string): ChildNode[] {
  const templateEl = document.createElement('template');
  templateEl.innerHTML = html;
  return Array.from(templateEl.content.childNodes);
}

/**
 * `{{{ expr }}}` raw HTML. Parses the string via a detached `<template>`
 * (inert — no script execution) and replaces the sibling range after
 * `anchor` with the result on every reactive update.
 */
export function bindRawHtml(
  record: Extract<BindingRecord, { kind: 'raw-html' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  let currentNodes: ChildNode[] = [];
  const handle = effect(() => {
    const html = stringify(evaluate(record.expr, scope, ctx.helpers));
    reportDiagnostic(ctx, {
      code: 'RAW_HTML_UNSANITIZED',
      severity: 'warning',
      message:
        'A {{{ }}} raw-HTML binding rendered without sanitization. template-core does not sanitize HTML ' +
        'content — sanitize untrusted values in the ViewModel before binding, and consider a Trusted Types ' +
        'policy under CSP. See docs/PRD.md §9 (Security).',
      template: ctx.templateName,
      sourcePath: ctx.sourcePath,
    });
    for (const n of currentNodes) n.remove();
    currentNodes = parseHtmlFragment(html);
    anchor.after(...currentNodes);
  });
  bag.add(() => {
    handle.dispose();
    for (const n of currentNodes) n.remove();
  });
}
