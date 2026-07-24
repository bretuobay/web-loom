import { TemplateSyntaxError } from '../errors.js';
import { preprocess } from './preprocess.js';
import { parseExpression } from './expression.js';
import { tokenizeText } from './text.js';
import { compileAttributes } from './attributes.js';
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

type MarkerType = 'open-if' | 'open-each' | 'else' | 'else-if' | 'close-if' | 'close-each';

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
  if (body === 'else') return { type: 'else', raw: '' };
  if (body.startsWith('else-if ')) return { type: 'else-if', raw: decodeURIComponent(body.slice(8)) };
  if (body === '/if') return { type: 'close-if', raw: '' };
  if (body === '/each') return { type: 'close-each', raw: '' };
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

function compileFragment(children: ChildNode[]): RootTemplate {
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
      if (marker.type === 'open-if' || marker.type === 'open-each') {
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

function scanBlock(children: ChildNode[], start: number, openType: 'if' | 'each'): ScanResult {
  const stack: Array<'if' | 'each'> = [openType];
  const elseMarkers: ScanResult['elseMarkers'] = [];

  for (let i = start + 1; i < children.length; i++) {
    const marker = parseMarker(children[i]!);
    if (!marker) continue;

    if (marker.type === 'open-if') {
      stack.push('if');
    } else if (marker.type === 'open-each') {
      stack.push('each');
    } else if (marker.type === 'close-if' || marker.type === 'close-each') {
      const closingType = marker.type === 'close-if' ? 'if' : 'each';
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

function extractBlock(
  children: ChildNode[],
  start: number,
  path: NodePath,
): { block: BlockRecord; nextIndex: number } {
  const openMarker = parseMarker(children[start]!)!;
  const openType = openMarker.type === 'open-if' ? 'if' : 'each';
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
