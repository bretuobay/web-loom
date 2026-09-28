import { TemplateSyntaxError } from '../errors.js';
import { preprocess } from './preprocess.js';
import { parseExpression } from './expression.js';
import { tokenizeText } from './text.js';
import { compileAttributes } from './attributes.js';
import { parsePartialInvocation } from './partial-invocation.js';
import type { BindingRecord, BlockRecord, ExpressionNode, IfBranch, NodePath, RootTemplate } from '../types.js';

const SVG_TAGS = new Set([
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'g',
  'text',
  'tspan',
  'defs',
  'use',
  'symbol',
  'clippath',
  'lineargradient',
  'radialgradient',
  'stop',
  'mask',
  'pattern',
  'foreignobject',
  'image',
]);

type MarkerType =
  | 'open-if'
  | 'open-each'
  | 'open-switch'
  | 'open-case'
  | 'open-default'
  | 'open-partial'
  | 'open-slot'
  | 'partial'
  | 'else'
  | 'else-if'
  | 'close-if'
  | 'close-each'
  | 'close-switch'
  | 'close-case'
  | 'close-default'
  | 'close-partial'
  | 'close-slot';

interface Marker {
  type: MarkerType;
  raw: string;
}

function parseMarker(node: Node): Marker | null {
  if (node.nodeType !== Node.COMMENT_NODE) return null;
  const data = (node as Comment).data;
  if (!data.startsWith('loom:')) return null;
  const body = data.slice(5);
  if (body.startsWith('#if ')) return { type: 'open-if', raw: decodeURIComponent(body.slice(4)) };
  if (body.startsWith('#each ')) return { type: 'open-each', raw: decodeURIComponent(body.slice(6)) };
  if (body.startsWith('#switch ')) return { type: 'open-switch', raw: decodeURIComponent(body.slice(8)) };
  if (body.startsWith('#case ')) return { type: 'open-case', raw: decodeURIComponent(body.slice(6)) };
  if (body === '#default') return { type: 'open-default', raw: '' };
  if (body.startsWith('partial ')) return { type: 'partial', raw: decodeURIComponent(body.slice(8)) };
  if (body.startsWith('open-partial ')) return { type: 'open-partial', raw: decodeURIComponent(body.slice(13)) };
  if (body.startsWith('close-partial ')) return { type: 'close-partial', raw: decodeURIComponent(body.slice(14)) };
  if (body.startsWith('open-slot ')) return { type: 'open-slot', raw: decodeURIComponent(body.slice(10)) };
  if (body === '/slot') return { type: 'close-slot', raw: '' };
  if (body === 'else') return { type: 'else', raw: '' };
  if (body.startsWith('else-if ')) return { type: 'else-if', raw: decodeURIComponent(body.slice(8)) };
  if (body === '/if') return { type: 'close-if', raw: '' };
  if (body === '/each') return { type: 'close-each', raw: '' };
  if (body === '/switch') return { type: 'close-switch', raw: '' };
  if (body === '/case') return { type: 'close-case', raw: '' };
  if (body === '/default') return { type: 'close-default', raw: '' };
  return null;
}

function isRawTextElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return tag === 'script' || tag === 'style';
}

/**
 * Parses a template source string into a RootTemplate AST: an inert
 * DocumentFragment blueprint plus the Binding/Block Records the runtime
 * needs to wire reactivity on each clone (PRD §8).
 */
export function parseTemplate(source: string): RootTemplate {
  const processed = preprocess(source);
  const rootTag = detectRootTagName(processed);
  const wrapSvg = rootTag !== null && SVG_TAGS.has(rootTag);

  const templateEl = document.createElement('template');
  templateEl.innerHTML = wrapSvg ? `<svg>${processed}</svg>` : processed;

  let contentChildren: ChildNode[];
  if (wrapSvg) {
    const svgEl = templateEl.content.firstElementChild;
    if (!svgEl) {
      throw new TemplateSyntaxError('Failed to parse SVG root template content.');
    }
    contentChildren = Array.from(svgEl.childNodes);
  } else {
    contentChildren = Array.from(templateEl.content.childNodes);
  }

  return compileFragment(contentChildren);
}

function detectRootTagName(source: string): string | null {
  const match = /^\s*<([a-zA-Z][a-zA-Z0-9-]*)/.exec(source);
  return match ? match[1]!.toLowerCase() : null;
}

export function compileFragment(children: ChildNode[]): RootTemplate {
  const blueprint = document.createDocumentFragment();
  const bindings: BindingRecord[] = [];
  const blocks: BlockRecord[] = [];
  compileInto(blueprint, children, bindings, blocks, []);
  return { blueprint, bindings, blocks };
}

function compileInto(
  target: Node,
  sourceChildren: ChildNode[],
  bindings: BindingRecord[],
  blocks: BlockRecord[],
  path: NodePath,
): void {
  let i = 0;
  while (i < sourceChildren.length) {
    const node = sourceChildren[i]!;
    const marker = parseMarker(node);

    if (marker) {
      if (marker.type === 'partial') {
        const currentPath = [...path, target.childNodes.length];
        target.appendChild(document.createComment('loom:anchor'));
        const invocation = parsePartialInvocation(marker.raw);
        blocks.push({
          kind: 'partial',
          path: currentPath,
          name: invocation.name,
          context: invocation.context,
          args: invocation.args,
        });
        i++;
        continue;
      }
      if (marker.type === 'open-partial') {
        const currentPath = [...path, target.childNodes.length];
        const { block, nextIndex } = extractBlockPartial(sourceChildren, i, currentPath);
        target.appendChild(document.createComment('loom:anchor'));
        blocks.push(block);
        i = nextIndex;
        continue;
      }
      if (marker.type === 'open-if' || marker.type === 'open-each' || marker.type === 'open-switch') {
        const currentPath = [...path, target.childNodes.length];
        const { block, nextIndex } = extractBlock(sourceChildren, i, currentPath);
        const anchor = document.createComment('loom:anchor');
        target.appendChild(anchor);
        blocks.push(block);
        i = nextIndex;
        continue;
      }
      throw new TemplateSyntaxError(
        `Unexpected template marker (${marker.type}) without a matching opening {{#if}}/{{#each}}.`,
      );
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const currentPath = [...path, target.childNodes.length];
      target.appendChild(el);
      bindings.push(...compileAttributes(el, currentPath));

      if (!isRawTextElement(el)) {
        const childSnapshot = Array.from(el.childNodes);
        while (el.firstChild) el.removeChild(el.firstChild);
        compileInto(el, childSnapshot, bindings, blocks, currentPath);
      }
      i++;
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const token = tokenizeText(text);
      const currentPath = [...path, target.childNodes.length];
      if (token.kind === 'static') {
        target.appendChild(document.createTextNode(token.value));
      } else if (token.kind === 'text') {
        target.appendChild(document.createTextNode(''));
        bindings.push({ kind: 'text', path: currentPath, parts: token.parts });
      } else {
        target.appendChild(document.createComment('loom:raw-html'));
        bindings.push({ kind: 'raw-html', path: currentPath, expr: token.expr });
      }
      i++;
      continue;
    }

    target.appendChild(node);
    i++;
  }
}

interface ScanResult {
  end: number;
  elseMarkers: Array<{ index: number; type: 'else' | 'else-if'; raw: string }>;
}

function scanBlock(children: ChildNode[], start: number, openType: 'if' | 'each' | 'switch'): ScanResult {
  const stack: Array<string> = [openType];
  const elseMarkers: ScanResult['elseMarkers'] = [];

  for (let i = start + 1; i < children.length; i++) {
    const marker = parseMarker(children[i]!);
    if (!marker) continue;

    if (marker.type === 'open-if') {
      stack.push('if');
    } else if (marker.type === 'open-each') {
      stack.push('each');
    } else if (marker.type === 'open-switch') {
      stack.push('switch');
    } else if (marker.type === 'open-case' || marker.type === 'open-default') {
      if (openType !== 'switch' || stack[stack.length - 1] !== 'switch')
        throw new TemplateSyntaxError('case/default markers are only valid directly inside switch.');
      stack.push(marker.type === 'open-case' ? 'case' : 'default');
    } else if (
      marker.type === 'close-if' ||
      marker.type === 'close-each' ||
      marker.type === 'close-switch' ||
      marker.type === 'close-case' ||
      marker.type === 'close-default'
    ) {
      const closingType =
        marker.type === 'close-if'
          ? 'if'
          : marker.type === 'close-each'
            ? 'each'
            : marker.type === 'close-switch'
              ? 'switch'
              : marker.type === 'close-case'
                ? 'case'
                : 'default';
      const top = stack[stack.length - 1];
      if (top !== closingType) {
        throw new TemplateSyntaxError(`Mismatched closing tag: expected {{/${top}}} but found {{/${closingType}}}`);
      }
      stack.pop();
      if (stack.length === 0) {
        return { end: i, elseMarkers };
      }
    } else if (marker.type === 'else') {
      if (stack.length === 1) {
        elseMarkers.push({ index: i, type: 'else', raw: '' });
      }
    } else if (marker.type === 'else-if') {
      if (stack.length === 1) {
        if (openType === 'each') {
          throw new TemplateSyntaxError(
            '{{else if}} is not valid inside {{#each}} — {{#each}} only supports a single {{else}} for the empty-list case.',
          );
        }
        elseMarkers.push({ index: i, type: 'else-if', raw: marker.raw });
      }
    }
  }

  throw new TemplateSyntaxError(`Unclosed {{#${openType}}} block`);
}

function extractBlock(children: ChildNode[], start: number, path: NodePath): { block: BlockRecord; nextIndex: number } {
  const openMarker = parseMarker(children[start]!)!;
  const openType = openMarker.type === 'open-if' ? 'if' : openMarker.type === 'open-each' ? 'each' : 'switch';
  const { end, elseMarkers } = scanBlock(children, start, openType);

  if (openType === 'if') {
    const branches: IfBranch[] = [];
    let segStart = start + 1;
    let condition: string | null = openMarker.raw;
    for (const marker of elseMarkers) {
      branches.push({
        condition: condition === null ? null : parseExpression(condition),
        template: compileFragment(children.slice(segStart, marker.index)),
      });
      segStart = marker.index + 1;
      condition = marker.type === 'else-if' ? marker.raw : null;
    }
    branches.push({
      condition: condition === null ? null : parseExpression(condition),
      template: compileFragment(children.slice(segStart, end)),
    });
    return { block: { kind: 'if', path, branches }, nextIndex: end + 1 };
  }

  if (openType === 'switch') {
    const branches: { value: ExpressionNode | null; template: RootTemplate }[] = [];
    let i = start + 1;
    while (i < end) {
      const m = parseMarker(children[i]!);
      if (!m || (m.type !== 'open-case' && m.type !== 'open-default'))
        throw new TemplateSyntaxError('{{#switch}} may contain only {{#case}} and {{#default}} branches.');
      const close = m.type === 'open-case' ? 'close-case' : 'close-default';
      let depth = 1;
      let j = i + 1;
      for (; j < end; j++) {
        const x = parseMarker(children[j]!);
        if (x?.type === m.type) depth++;
        if (x?.type === close && --depth === 0) break;
      }
      if (j >= end)
        throw new TemplateSyntaxError(`Unclosed ${m.type === 'open-case' ? '{{#case}}' : '{{#default}}'} block.`);
      branches.push({
        value: m.type === 'open-case' ? parseExpression(m.raw) : null,
        template: compileFragment(children.slice(i + 1, j)),
      });
      i = j + 1;
    }
    if (!branches.length || branches.filter((b) => b.value === null).length > 1)
      throw new TemplateSyntaxError('{{#switch}} requires branches and at most one {{#default}}.');
    return { block: { kind: 'switch', path, source: parseExpression(openMarker.raw), branches }, nextIndex: end + 1 };
  }

  if (elseMarkers.length > 1) {
    throw new TemplateSyntaxError('{{#each}} may have at most one {{else}} block.');
  }

  const { source, key } = parseEachHeader(openMarker.raw);
  let itemChildren: ChildNode[];
  let empty: RootTemplate | undefined;
  if (elseMarkers.length === 1) {
    const sep = elseMarkers[0]!;
    itemChildren = children.slice(start + 1, sep.index);
    empty = compileFragment(children.slice(sep.index + 1, end));
  } else {
    itemChildren = children.slice(start + 1, end);
  }

  return {
    block: { kind: 'each', path, source, key, template: compileFragment(itemChildren), empty },
    nextIndex: end + 1,
  };
}

function extractBlockPartial(
  children: ChildNode[],
  start: number,
  path: NodePath,
): { block: BlockRecord; nextIndex: number } {
  const openMarker = parseMarker(children[start]!)!;
  const invocation = parsePartialInvocation(openMarker.raw);
  const end = scanBlockPartial(children, start, invocation.name);
  const slots = splitSlotTemplates(children.slice(start + 1, end));
  return {
    block: {
      kind: 'partial',
      path,
      name: invocation.name,
      context: invocation.context,
      args: invocation.args,
      slots,
    },
    nextIndex: end + 1,
  };
}

function scanBlockPartial(children: ChildNode[], start: number, name: string): number {
  const stack = [name];
  for (let i = start + 1; i < children.length; i++) {
    const marker = parseMarker(children[i]!);
    if (!marker) continue;
    if (marker.type === 'open-partial') {
      stack.push(parsePartialInvocation(marker.raw).name);
    } else if (marker.type === 'close-partial') {
      const top = stack[stack.length - 1];
      if (top !== marker.raw) {
        throw new TemplateSyntaxError(`Mismatched closing tag: expected {{/${top}}} but found {{/${marker.raw}}}`);
      }
      stack.pop();
      if (stack.length === 0) return i;
    }
  }
  throw new TemplateSyntaxError(`Unclosed {{#> ${name}}} block`);
}

function splitSlotTemplates(children: ChildNode[]): Record<string, RootTemplate> {
  const slots: Record<string, RootTemplate> = {};
  const defaultNodes: ChildNode[] = [];
  let i = 0;
  while (i < children.length) {
    const marker = parseMarker(children[i]!);
    if (marker?.type === 'open-slot') {
      const slotName = marker.raw.trim() || 'default';
      if (slotName in slots) {
        throw new TemplateSyntaxError(`Duplicate slot "${slotName}" in block partial.`);
      }
      let depth = 1;
      let j = i + 1;
      for (; j < children.length; j++) {
        const inner = parseMarker(children[j]!);
        if (inner?.type === 'open-slot') depth++;
        if (inner?.type === 'close-slot' && --depth === 0) break;
      }
      if (j >= children.length) throw new TemplateSyntaxError(`Unclosed {{#slot ${slotName}}} block.`);
      slots[slotName] = compileFragment(children.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    defaultNodes.push(children[i]!);
    i++;
  }
  if (defaultNodes.some((node) => !isIgnorableSlotNode(node))) {
    if ('default' in slots) {
      throw new TemplateSyntaxError('Block partial cannot have both implicit default content and {{#slot default}}.');
    }
    slots.default = compileFragment(defaultNodes);
  }
  return slots;
}

function isIgnorableSlotNode(node: ChildNode): boolean {
  return node.nodeType === Node.TEXT_NODE && !(node.textContent ?? '').trim();
}

function parseEachHeader(raw: string): { source: ExpressionNode; key: ExpressionNode } {
  const match = /^([\s\S]*?)\bkey\s*=\s*(.+)$/.exec(raw);
  if (!match) {
    throw new TemplateSyntaxError(
      `{{#each}} requires a "key=" expression, e.g. {{#each items key=id}} or {{#each items key=this}} (found "{{#each ${raw}}}").`,
    );
  }
  const sourceSrc = match[1]!.trim();
  const keySrc = match[2]!.trim();
  const key = parseExpression(keySrc);
  if (key.kind !== 'path') {
    throw new TemplateSyntaxError(`{{#each}} "key=" must be a simple path (e.g. "id" or "this"), found "${keySrc}".`);
  }
  return { source: parseExpression(sourceSrc), key };
}
