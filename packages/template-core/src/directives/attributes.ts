import { effect } from '@web-loom/signals-core';
import { evaluate } from '../runtime/evaluate.js';
import { reportDiagnostic } from '../runtime/diagnostics.js';
import { isDangerousUrlScheme, isUrlBearingAttribute } from '../runtime/url-safety.js';
import type { DisposalBag } from '../runtime/disposal.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';

function stringify(value: unknown): string {
  return value == null ? '' : String(value);
}

function warnIfUnsafeUrl(ctx: RenderContext, name: string, value: string): void {
  if (!isUrlBearingAttribute(name) || !isDangerousUrlScheme(value)) return;
  reportDiagnostic(ctx, {
    code: 'UNSAFE_URL_SCHEME',
    severity: 'warning',
    message:
      `Attribute "${name}" was bound to a value with a potentially unsafe URL scheme. template-core does ` +
      'not validate or sanitize URLs — allow-list http(s)/mailto/tel schemes in the ViewModel before ' +
      'binding untrusted URLs. See docs/PRD.md §9 (Security).',
    template: ctx.templateName,
    sourcePath: ctx.sourcePath,
    details: { attribute: name },
  });
}

/** A plain attribute containing `{{ }}` interpolation, e.g. `src="{{ photo$ }}"`. */
export function bindAttrInterp(
  record: Extract<BindingRecord, { kind: 'attr-interp' }>,
  el: Element,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const handle = effect(() => {
    const value = record.parts
      .map((part) => ('static' in part ? part.static : stringify(evaluate(part.expr, scope, ctx.helpers))))
      .join('');
    warnIfUnsafeUrl(ctx, record.name, value);
    el.setAttribute(record.name, value);
  });
  bag.add(handle.dispose);
}

/**
 * `:name="expr"` — property when `name` is a live property of the element
 * (required for `value`, `checked`, etc., where the HTML attribute only sets
 * the *default*), otherwise `setAttribute` (covers `aria-*`/`data-*`/SVG
 * attributes), with boolean values toggling attribute presence.
 */
export function bindPropOrAttr(
  record: Extract<BindingRecord, { kind: 'prop-or-attr' }>,
  el: Element,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const handle = effect(() => {
    const value = evaluate(record.expr, scope, ctx.helpers);
    if (typeof value === 'string') warnIfUnsafeUrl(ctx, record.name, value);
    applyPropOrAttr(el, record.name, value);
  });
  bag.add(handle.dispose);
}

function applyPropOrAttr(el: Element, name: string, value: unknown): void {
  if (name in el) {
    (el as unknown as Record<string, unknown>)[name] = value;
    return;
  }
  if (typeof value === 'boolean') {
    if (value) {
      el.setAttribute(name, '');
    } else {
      el.removeAttribute(name);
    }
    return;
  }
  if (value == null) {
    el.removeAttribute(name);
    return;
  }
  el.setAttribute(name, String(value));
}
