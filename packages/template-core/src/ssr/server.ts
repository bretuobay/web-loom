import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5';
import { preprocess } from '../compiler/preprocess.js';
import { tokenizeText } from '../compiler/text.js';
import { parseExpression } from '../compiler/expression.js';
import { evaluate, truthy } from '../runtime/evaluate.js';
import type { RenderContext, Scope, TemplateOptions } from '../types.js';

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

function renderParts(text: string, scope: Scope, ctx: RenderContext): string {
  const token = tokenizeText(text);
  if (token.kind === 'static') return escapeHtml(token.value);
  if (token.kind === 'raw-html')
    return `<${'!--loom:raw-html--'}>${stringify(evaluate(token.expr, scope, ctx.helpers))}`;
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
      } else if (valueResult != null) attrs.set('value', String(valueResult));
      continue;
    }
    if (name.startsWith(':')) {
      const attrName = name.slice(1);
      const attrValue = evaluate(parseExpression(value), scope, ctx.helpers);
      if (typeof attrValue === 'boolean') {
        if (attrValue) attrs.set(attrName, '');
      } else if (attrValue != null) attrs.set(attrName, String(attrValue));
      continue;
    }
    const token = tokenizeText(value);
    if (token.kind === 'text') {
      attrs.set(
        name,
        token.parts
          .map((part) => ('static' in part ? part.static : stringify(evaluate(part.expr, scope, ctx.helpers))))
          .join(''),
      );
    } else if (token.kind === 'static') {
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
          .map((item, index) =>
            renderNodes(
              nodes.slice(start + 1, emptyIndex ?? close.end),
              scopeFor(scope, item, {
                '@index': index,
                '@first': index === 0,
                '@last': index === list.length - 1,
                '@even': index % 2 === 0,
                '@odd': index % 2 !== 0,
              }),
              ctx,
            ),
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
    if (current?.kind === 'partial') {
      const bits = current.raw.trim().split(/\s+/);
      const source = ctx.partials?.[bits[0]!] ?? ctx.registry?.get(bits[0]!);
      if (!source) {
        const message = `Missing partial "${bits[0]}".`;
        if (ctx.strictPartials) throw new Error(message);
        (ctx.diagnostics?.warn ?? console.warn)(message);
        html += '<!--loom:anchor-->';
      } else if (ctx.partialStack?.includes(bits[0]!)) {
        throw new Error(`Recursive partial expansion: ${[...(ctx.partialStack ?? []), bits[0]!].join(' → ')}`);
      } else {
        const partialContext = bits[1] ? evaluate(parseExpression(bits[1]), scope, ctx.helpers) : scope.self;
        const stack = (ctx.partialStack ??= []);
        stack.push(bits[0]!);
        html +=
          '<!--loom:anchor-->' +
          (typeof source === 'string'
            ? renderSource(source, partialContext, ctx, scope)
            : source.renderToString(partialContext as object));
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

function renderSource(source: string, viewModel: unknown, ctx: RenderContext, parent: Scope | null = null): string {
  const fragment = parseFragment(preprocess(source));
  const scope = scopeFor(parent ?? { parent: null, self: viewModel, locals: {} }, viewModel);
  return renderNodes(fragment.childNodes, scope, ctx);
}

export function renderSourceToString(source: string, viewModel: unknown, options: TemplateOptions = {}): string {
  const ctx: RenderContext = {
    helpers: options.helpers ?? {},
    escape: options.escape ?? true,
    partials: options.partials,
    registry: options.registry,
    templateName: options.name,
    strictPartials: options.strictPartials ?? false,
    diagnostics: {
      warn: options.diagnostics?.warn ?? ((message) => console.warn(message)),
      error: options.diagnostics?.error ?? ((message) => console.error(message)),
    },
    partialStack: [],
  };
  return renderSource(source, viewModel, ctx);
}
