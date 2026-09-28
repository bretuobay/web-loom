import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5';
import { preprocess } from '../compiler/preprocess.js';
import { tokenizeText } from '../compiler/text.js';
import { parseExpression } from '../compiler/expression.js';
import { parsePartialInvocation } from '../compiler/partial-invocation.js';
import { evaluate, truthy } from '../runtime/evaluate.js';
import { resolvePartialContext } from '../runtime/partial-context.js';
import { reportDiagnostic } from '../runtime/diagnostics.js';
import { isDangerousUrlScheme, isUrlBearingAttribute } from '../runtime/url-safety.js';
import type { RenderContext, Scope, SerializableNode, SerializableRootTemplate, TemplateOptions } from '../types.js';

type Node = DefaultTreeAdapterTypes.ChildNode;
type Element = DefaultTreeAdapterTypes.Element;
type CommentNode = DefaultTreeAdapterTypes.CommentNode;

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stringify(value: unknown): string {
  return value == null ? '' : String(value);
}

function marker(node: Node): { kind: string; raw: string } | null {
  if (node.nodeName !== '#comment') return null;
  const body = (node as CommentNode).data.slice(5);
  if (!(node as CommentNode).data.startsWith('loom:')) return null;
  if (body.startsWith('#if ')) return { kind: 'if', raw: decodeURIComponent(body.slice(4)) };
  if (body.startsWith('#each ')) return { kind: 'each', raw: decodeURIComponent(body.slice(6)) };
  if (body.startsWith('#switch ')) return { kind: 'switch', raw: decodeURIComponent(body.slice(8)) };
  if (body.startsWith('partial ')) return { kind: 'partial', raw: decodeURIComponent(body.slice(8)) };
  if (body.startsWith('open-partial ')) return { kind: 'open-partial', raw: decodeURIComponent(body.slice(13)) };
  if (body.startsWith('close-partial ')) return { kind: 'close-partial', raw: decodeURIComponent(body.slice(14)) };
  if (body.startsWith('open-slot ')) return { kind: 'open-slot', raw: decodeURIComponent(body.slice(10)) };
  if (body === '/slot') return { kind: '/slot', raw: '' };
  if (body === 'else') return { kind: 'else', raw: '' };
  if (body.startsWith('else-if ')) return { kind: 'else-if', raw: decodeURIComponent(body.slice(8)) };
  if (body === '/if') return { kind: '/if', raw: '' };
  if (body === '/each') return { kind: '/each', raw: '' };
  if (body === '/switch') return { kind: '/switch', raw: '' };
  if (body.startsWith('#case ')) return { kind: 'case', raw: decodeURIComponent(body.slice(6)) };
  if (body === '#default') return { kind: 'default', raw: '' };
  if (body === '/case') return { kind: '/case', raw: '' };
  if (body === '/default') return { kind: '/default', raw: '' };
  return null;
}

function scopeFor(parent: Scope, self: unknown, locals: Record<string, unknown> = {}): Scope {
  return { parent, self, locals };
}

function findClose(
  nodes: Node[],
  start: number,
  open: string,
): { end: number; separators: Array<{ index: number; marker: { kind: string; raw: string } }> } {
  const stack = [open];
  const separators: Array<{ index: number; marker: { kind: string; raw: string } }> = [];
  for (let i = start + 1; i < nodes.length; i++) {
    const current = marker(nodes[i]!);
    if (!current) continue;
    if (['if', 'each', 'switch', 'case', 'default'].includes(current.kind)) stack.push(current.kind);
    else if (current.kind.startsWith('/') && stack[stack.length - 1] === current.kind.slice(1)) {
      stack.pop();
      if (stack.length === 0) return { end: i, separators };
    } else if (stack.length === 1 && (current.kind === 'else' || current.kind === 'else-if')) {
      separators.push({ index: i, marker: current });
    }
  }
  throw new Error(`Unclosed SSR block {{#${open}}}.`);
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

function renderParts(text: string, scope: Scope, ctx: RenderContext): string {
  const token = tokenizeText(text);
  if (token.kind === 'static') return escapeHtml(token.value);
  if (token.kind === 'raw-html') {
    const html = stringify(evaluate(token.expr, scope, ctx.helpers));
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
    return `<${'!--loom:raw-html--'}>${html}`;
  }
  return token.parts
    .map((part) => ('static' in part ? escapeHtml(part.static) : escapeHtml(evaluate(part.expr, scope, ctx.helpers))))
    .join('');
}

function renderAttributes(element: Element, scope: Scope, ctx: RenderContext): string {
  const attrs = new Map<string, string>();
  const classes: string[] = [];
  const styles = new Map<string, string>();
  for (const attr of element.attrs) {
    const { name, value } = attr;
    if (name.startsWith('on:') || name.startsWith('use:') || name === 'bind:set') continue;
    if (name.startsWith('class:')) {
      if (truthy(evaluate(parseExpression(value), scope, ctx.helpers))) classes.push(name.slice(6));
      continue;
    }
    if (name.startsWith('style:')) {
      const styleValue = evaluate(parseExpression(value), scope, ctx.helpers);
      if (styleValue != null) styles.set(name.slice(6), String(styleValue));
      continue;
    }
    if (name.startsWith('bind:')) {
      const bindName = name.slice(5);
      const valueResult = evaluate(parseExpression(value), scope, ctx.helpers);
      if (bindName === 'checked') {
        if (truthy(valueResult)) attrs.set('checked', '');
      } else if (valueResult != null) {
        const stringValue = String(valueResult);
        warnIfUnsafeUrl(ctx, 'value', stringValue);
        attrs.set('value', stringValue);
      }
      continue;
    }
    if (name.startsWith(':')) {
      const attrName = name.slice(1);
      const attrValue = evaluate(parseExpression(value), scope, ctx.helpers);
      if (typeof attrValue === 'boolean') {
        if (attrValue) attrs.set(attrName, '');
      } else if (attrValue != null) {
        const stringValue = String(attrValue);
        warnIfUnsafeUrl(ctx, attrName, stringValue);
        attrs.set(attrName, stringValue);
      }
      continue;
    }
    const token = tokenizeText(value);
    if (token.kind === 'text') {
      const stringValue = token.parts
        .map((part) => ('static' in part ? part.static : stringify(evaluate(part.expr, scope, ctx.helpers))))
        .join('');
      warnIfUnsafeUrl(ctx, name, stringValue);
      attrs.set(name, stringValue);
    } else if (token.kind === 'static') {
      // No {{ }} interpolation at all — literal, author-controlled markup, not a "binding" of
      // potentially-untrusted data. Matches the browser path: bindAttrInterp only runs for
      // attributes containing interpolation, so a purely-static attribute never warns there either.
      attrs.set(name, value);
    }
  }
  if (classes.length > 0) attrs.set('class', [attrs.get('class'), ...classes].filter(Boolean).join(' '));
  if (styles.size > 0)
    attrs.set(
      'style',
      [attrs.get('style'), ...[...styles].map(([key, value]) => `${key}:${value}`)].filter(Boolean).join(';'),
    );
  return [...attrs].map(([name, value]) => ` ${name}="${escapeHtml(value)}"`).join('');
}

function renderElement(element: Element, scope: Scope, ctx: RenderContext): string {
  const open = `<${element.tagName}${renderAttributes(element, scope, ctx)}>`;
  if (VOID_ELEMENTS.has(element.tagName)) return open;
  return `${open}${renderNodes(element.childNodes, scope, ctx)}</${element.tagName}>`;
}

function renderBlock(
  nodes: Node[],
  start: number,
  scope: Scope,
  ctx: RenderContext,
  open: string,
): { html: string; next: number } {
  const close = findClose(nodes, start, open);
  const anchor = '<!--loom:anchor-->';
  if (open === 'if') {
    const separators = [...close.separators, { index: close.end, marker: { kind: 'else', raw: '' } }];
    let segmentStart = start + 1;
    let selected = '';
    let selectedBranch = false;
    for (const separator of separators) {
      const condition = segmentStart === start + 1 ? nodes[start] : undefined;
      const conditionMarker = separator.marker.kind === 'else-if' ? separator.marker.raw : null;
      const expression = conditionMarker ?? (condition ? (marker(condition)?.raw ?? '') : null);
      if (
        !selectedBranch &&
        (expression === null || truthy(evaluate(parseExpression(expression), scope, ctx.helpers)))
      ) {
        selected = renderNodes(nodes.slice(segmentStart, separator.index), scope, ctx);
        selectedBranch = true;
      }
      segmentStart = separator.index + 1;
    }
    return { html: anchor + selected, next: close.end + 1 };
  }
  if (open === 'each') {
    const source = marker(nodes[start]!)?.raw ?? '';
    const split = source.match(/^([\s\S]*?)\bkey\s*=\s*(.+)$/);
    const items = evaluate(parseExpression(split?.[1]?.trim() ?? source), scope, ctx.helpers);
    const list = Array.isArray(items) ? items : [];
    const emptyIndex = close.separators[0]?.index;
    if (list.length === 0 && emptyIndex != null)
      return { html: anchor + renderNodes(nodes.slice(emptyIndex + 1, close.end), scope, ctx), next: close.end + 1 };
    return {
      html:
        anchor +
        list
          .map(
            (item, index) =>
              `<!--loom:item-->${renderNodes(
                nodes.slice(start + 1, emptyIndex ?? close.end),
                scopeFor(scope, item, {
                  '@index': index,
                  '@first': index === 0,
                  '@last': index === list.length - 1,
                  '@even': index % 2 === 0,
                  '@odd': index % 2 !== 0,
                }),
                ctx,
              )}<!--loom:item-end-->`,
          )
          .join(''),
      next: close.end + 1,
    };
  }
  const source = marker(nodes[start]!)?.raw ?? '';
  const value = evaluate(parseExpression(source), scope, ctx.helpers);
  let selected = '';
  let selectedBranch = false;
  let cursor = start + 1;
  while (cursor < close.end) {
    const branch = marker(nodes[cursor]!);
    if (!branch || (branch.kind !== 'case' && branch.kind !== 'default'))
      throw new Error('SSR switch requires case/default branches.');
    const branchClose = findClose(nodes, cursor, branch.kind);
    if (
      !selectedBranch &&
      (branch.kind === 'default' || evaluate(parseExpression(branch.raw), scope, ctx.helpers) === value)
    )
      selected = renderNodes(nodes.slice(cursor + 1, branchClose.end), scope, ctx);
    selectedBranch = true;
    cursor = branchClose.end + 1;
  }
  return { html: anchor + selected, next: close.end + 1 };
}

function renderNodes(nodes: Node[], scope: Scope, ctx: RenderContext): string {
  let html = '';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const current = marker(node);
    if (current?.kind === 'if' || current?.kind === 'each' || current?.kind === 'switch') {
      const block = renderBlock(nodes, i, scope, ctx, current.kind);
      html += block.html;
      i = block.next - 1;
      continue;
    }
    if (current?.kind === 'open-partial') {
      const block = renderBlockPartial(nodes, i, scope, ctx, current.raw);
      html += block.html;
      i = block.next - 1;
      continue;
    }
    if (current?.kind === 'partial') {
      const invocation = parsePartialInvocation(current.raw);
      if (invocation.name === 'yield') {
        html += '<!--loom:anchor-->' + renderYield(invocation, scope, ctx);
        continue;
      }
      const source = ctx.partials?.[invocation.name] ?? ctx.registry?.get(invocation.name);
      if (!source) {
        const message = `Missing partial "${invocation.name}".`;
        reportDiagnostic(ctx, {
          code: 'MISSING_PARTIAL',
          severity: ctx.strictPartials ? 'error' : 'warning',
          message,
          template: ctx.templateName,
          sourcePath: ctx.sourcePath,
          details: { partial: invocation.name },
        });
        if (ctx.strictPartials) throw new Error(message);
        html += '<!--loom:anchor-->';
      } else if (ctx.partialStack?.includes(invocation.name)) {
        throw new Error(`Recursive partial expansion: ${[...(ctx.partialStack ?? []), invocation.name].join(' → ')}`);
      } else {
        const resolved = resolvePartialContext(
          { context: invocation.context, args: invocation.args },
          scope,
          ctx.helpers,
          typeof source === 'string' ? undefined : source,
        );
        const stack = (ctx.partialStack ??= []);
        stack.push(invocation.name);
        html +=
          '<!--loom:anchor-->' +
          (typeof source === 'string'
            ? renderSource(source, resolved.self, ctx, resolved.isolated ? null : scope, resolved.isolated)
            : source.renderToString(resolved.self as object));
        resolved.dispose?.();
        stack.pop();
      }
      continue;
    }
    if (node.nodeName === '#comment') continue;
    if (node.nodeName === '#text') {
      html += renderParts((node as DefaultTreeAdapterTypes.TextNode).value, scope, ctx);
    } else if (node.nodeName === '#documentType') {
      html += '<!DOCTYPE html>';
    } else {
      html += renderElement(node as Element, scope, ctx);
    }
  }
  return html;
}

function toServerNode(node: SerializableNode): Node {
  if (node.kind === 'text') return { nodeName: '#text', value: node.value ?? '' } as Node;
  if (node.kind === 'comment') return { nodeName: '#comment', data: node.value ?? '' } as Node;
  if (node.kind === 'doctype') return { nodeName: '#documentType' } as Node;
  return {
    nodeName: node.name ?? 'div',
    tagName: node.name ?? 'div',
    attrs: node.attributes ?? [],
    childNodes: (node.children ?? []).map(toServerNode),
  } as unknown as Node;
}

function renderYield(invocation: ReturnType<typeof parsePartialInvocation>, scope: Scope, ctx: RenderContext): string {
  const frame = ctx.serverSlotStack?.[ctx.serverSlotStack.length - 1];
  if (!frame) return '';
  const rawName = invocation.args?.name ? evaluate(invocation.args.name, scope, ctx.helpers) : 'default';
  const slotName = rawName == null || rawName === '' ? 'default' : String(rawName);
  const nodes = frame.slots[slotName] as Node[] | undefined;
  return nodes ? renderNodes(nodes, frame.callerScope, ctx) : '';
}

function renderBlockPartial(
  nodes: Node[],
  start: number,
  scope: Scope,
  ctx: RenderContext,
  raw: string,
): { html: string; next: number } {
  const invocation = parsePartialInvocation(raw);
  let depth = 1;
  let end = start + 1;
  for (; end < nodes.length; end++) {
    const current = marker(nodes[end]!);
    if (current?.kind === 'open-partial') depth++;
    if (current?.kind === 'close-partial' && current.raw === invocation.name && --depth === 0) break;
  }
  if (end >= nodes.length) throw new Error(`Unclosed {{#> ${invocation.name}}} block`);

  const slots = splitServerSlots(nodes.slice(start + 1, end));
  const source = ctx.partials?.[invocation.name] ?? ctx.registry?.get(invocation.name);
  if (!source) {
    const message = `Missing partial "${invocation.name}".`;
    reportDiagnostic(ctx, {
      code: 'MISSING_PARTIAL',
      severity: ctx.strictPartials ? 'error' : 'warning',
      message,
      template: ctx.templateName,
      sourcePath: ctx.sourcePath,
      details: { partial: invocation.name },
    });
    if (ctx.strictPartials) throw new Error(message);
    return { html: '<!--loom:anchor-->', next: end + 1 };
  }

  const resolved = resolvePartialContext(
    { context: invocation.context, args: invocation.args },
    scope,
    ctx.helpers,
    typeof source === 'string' ? undefined : source,
  );
  (ctx.serverSlotStack ??= []).push({ slots, callerScope: scope });
  const html =
    '<!--loom:anchor-->' +
    (typeof source === 'string'
      ? renderSource(source, resolved.self, ctx, resolved.isolated ? null : scope, resolved.isolated)
      : source.renderToString(resolved.self as object));
  ctx.serverSlotStack.pop();
  resolved.dispose?.();
  return { html, next: end + 1 };
}

function splitServerSlots(nodes: Node[]): Record<string, Node[]> {
  const slots: Record<string, Node[]> = {};
  const defaultNodes: Node[] = [];
  let i = 0;
  while (i < nodes.length) {
    const current = marker(nodes[i]!);
    if (current?.kind === 'open-slot') {
      const slotName = current.raw.trim() || 'default';
      let depth = 1;
      let j = i + 1;
      for (; j < nodes.length; j++) {
        const inner = marker(nodes[j]!);
        if (inner?.kind === 'open-slot') depth++;
        if (inner?.kind === '/slot' && --depth === 0) break;
      }
      slots[slotName] = nodes.slice(i + 1, j);
      i = j + 1;
      continue;
    }
    defaultNodes.push(nodes[i]!);
    i++;
  }
  if (defaultNodes.some((node) => node.nodeName !== '#text' || Boolean((node as { value?: string }).value?.trim()))) {
    slots.default ??= defaultNodes;
  }
  return slots;
}

function renderSource(
  source: string,
  viewModel: unknown,
  ctx: RenderContext,
  parent: Scope | null = null,
  isolated = false,
): string {
  const fragment = parseFragment(preprocess(source));
  const scope: Scope = isolated
    ? { parent: null, self: viewModel, locals: {} }
    : scopeFor(parent ?? { parent: null, self: viewModel, locals: {} }, viewModel);
  return renderNodes(fragment.childNodes, scope, ctx);
}

export function renderSourceToString(source: string, viewModel: unknown, options: TemplateOptions = {}): string {
  return renderNodesFromContext(parseFragment(preprocess(source)).childNodes, viewModel, options);
}

function renderNodesFromContext(nodes: Node[], viewModel: unknown, options: TemplateOptions): string {
  const ctx: RenderContext = {
    helpers: options.helpers ?? {},
    escape: options.escape ?? true,
    partials: options.partials,
    registry: options.registry,
    templateName: options.name,
    strictPartials: options.strictPartials ?? false,
    diagnostics: {
      report: options.diagnostics?.report,
      warn: options.diagnostics?.warn ?? ((message) => console.warn(message)),
      error: options.diagnostics?.error ?? ((message) => console.error(message)),
    },
    sourcePath: options.sourcePath,
    partialStack: [],
    serverSlotStack: [],
  };
  return renderNodes(nodes, scopeFor({ parent: null, self: viewModel, locals: {} }, viewModel), ctx);
}

export function renderPlanToString(
  plan: SerializableRootTemplate,
  viewModel: unknown,
  options: TemplateOptions = {},
): string {
  return renderNodesFromContext(plan.nodes.map(toServerNode), viewModel, options);
}
