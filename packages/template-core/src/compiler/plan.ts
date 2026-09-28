import type {
  BlockRecord,
  RootTemplate,
  SerializableBlockRecord,
  SerializableNode,
  SerializableRootTemplate,
  SourceLocation,
} from '../types.js';
import { compileFragment } from './parser.js';

function serializeNode(node: ChildNode): SerializableNode {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    return {
      kind: 'element',
      name: element.localName ?? element.tagName.toLowerCase(),
      namespace: element.namespaceURI,
      attributes: Array.from(element.attributes).map(({ name, value }) => ({ name, value })),
      children: Array.from(element.childNodes).map(serializeNode),
    };
  }
  if (node.nodeType === Node.TEXT_NODE) return { kind: 'text', value: node.textContent ?? '' };
  if (node.nodeType === Node.COMMENT_NODE) return { kind: 'comment', value: (node as Comment).data };
  if (node.nodeType === Node.DOCUMENT_TYPE_NODE) return { kind: 'doctype', value: node.textContent ?? '' };
  return { kind: 'text', value: '' };
}

function serializeBlock(block: BlockRecord): SerializableBlockRecord {
  switch (block.kind) {
    case 'if':
      return {
        kind: 'if',
        path: block.path,
        branches: block.branches.map((branch) => ({ ...branch, template: serializeRootTemplate(branch.template) })),
      };
    case 'each':
      return {
        kind: 'each',
        path: block.path,
        source: block.source,
        key: block.key,
        template: serializeRootTemplate(block.template),
        ...(block.empty ? { empty: serializeRootTemplate(block.empty) } : {}),
      };
    case 'switch':
      return {
        kind: 'switch',
        path: block.path,
        source: block.source,
        branches: block.branches.map((branch) => ({ ...branch, template: serializeRootTemplate(branch.template) })),
      };
    case 'partial': {
      const { slots, ...rest } = block;
      return {
        ...rest,
        ...(slots
          ? {
              slots: Object.fromEntries(
                Object.entries(slots).map(([name, template]) => [name, serializeRootTemplate(template)]),
              ),
            }
          : {}),
      };
    }
  }
}

export function createSourceMap(root: RootTemplate, source: string): Record<string, SourceLocation> {
  const result: Record<string, SourceLocation> = {};
  let cursor = 0;
  const locationAt = (offset: number): SourceLocation => {
    const before = source.slice(0, offset);
    const line = before.split('\n').length;
    const lastBreak = before.lastIndexOf('\n');
    return { line, column: offset - lastBreak, offset };
  };
  const visit = (nodes: ChildNode[], parentPath: number[]): void => {
    nodes.forEach((node, index) => {
      const path = [...parentPath, index];
      let offset = cursor;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const name = (node as Element).localName ?? (node as Element).tagName.toLowerCase();
        offset = source.toLowerCase().indexOf(`<${name}`, cursor);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        offset = source.indexOf(node.textContent, cursor);
      } else {
        offset = source.indexOf('{{', cursor);
      }
      if (offset < 0) offset = cursor;
      result[path.join('.')] = locationAt(offset);
      cursor = Math.max(cursor, offset + 1);
      if (node.nodeType === Node.ELEMENT_NODE) visit(Array.from(node.childNodes), path);
    });
  };
  visit(Array.from(root.blueprint.childNodes), []);
  return result;
}

export function serializeRootTemplate(root: RootTemplate): SerializableRootTemplate {
  return {
    nodes: Array.from(root.blueprint.childNodes).map(serializeNode),
    bindings: root.bindings,
    blocks: root.blocks.map(serializeBlock),
    compiled: true,
  };
}

function deserializeNode(node: SerializableNode): ChildNode {
  if (node.kind === 'text') return document.createTextNode(node.value ?? '');
  if (node.kind === 'comment') return document.createComment(node.value ?? '');
  if (node.kind === 'doctype') return document.createComment(`loom:doctype ${node.value ?? ''}`);

  const element = node.namespace
    ? document.createElementNS(node.namespace, node.name ?? 'div')
    : document.createElement(node.name ?? 'div');
  for (const attribute of node.attributes ?? []) element.setAttribute(attribute.name, attribute.value);
  for (const child of node.children ?? []) element.append(deserializeNode(child));
  return element;
}

function deserializeBlock(block: SerializableBlockRecord): BlockRecord {
  switch (block.kind) {
    case 'if':
      return {
        kind: 'if',
        path: block.path,
        branches: block.branches.map((branch) => ({ ...branch, template: deserializeRootTemplate(branch.template) })),
      };
    case 'each':
      return {
        kind: 'each',
        path: block.path,
        source: block.source,
        key: block.key,
        template: deserializeRootTemplate(block.template),
        ...(block.empty ? { empty: deserializeRootTemplate(block.empty) } : {}),
      };
    case 'switch':
      return {
        kind: 'switch',
        path: block.path,
        source: block.source,
        branches: block.branches.map((branch) => ({ ...branch, template: deserializeRootTemplate(branch.template) })),
      };
    case 'partial': {
      const { slots, ...rest } = block;
      return {
        ...rest,
        ...(slots
          ? {
              slots: Object.fromEntries(
                Object.entries(slots).map(([name, template]) => [name, deserializeRootTemplate(template)]),
              ),
            }
          : {}),
      };
    }
  }
}

export function deserializeRootTemplate(plan: SerializableRootTemplate): RootTemplate {
  const blueprint = document.createDocumentFragment();
  for (const node of plan.nodes) blueprint.append(deserializeNode(node));
  if (plan.compiled === false) return compileFragment(Array.from(blueprint.childNodes));
  return { blueprint, bindings: plan.bindings, blocks: plan.blocks.map(deserializeBlock) };
}
