import { bindText, bindRawHtml } from '../directives/text.js';
import { bindAttrInterp, bindPropOrAttr } from '../directives/attributes.js';
import { bindClass } from '../directives/classes.js';
import { bindStyle } from '../directives/styles.js';
import { bindEvent } from '../directives/events.js';
import { bindInput } from '../directives/bind.js';
import { bindAction } from '../directives/action.js';
import { bindIf } from '../directives/if.js';
import { bindEach } from '../directives/each.js';
import { bindSwitch } from '../directives/switch.js';
import { bindPartial } from '../directives/partial.js';
import { DisposalBag } from './disposal.js';
import type { NodePath, RenderContext, RootTemplate, Scope } from '../types.js';

/** Resolves a NodePath (child-index address) against a persisted roots array. */
export function getNodeAt(roots: ChildNode[], path: NodePath): Node {
  const logicalChildren = (parent: ParentNode): ChildNode[] =>
    Array.from(parent.childNodes).filter(
      (child) => !(child.nodeType === Node.COMMENT_NODE && /^loom:item(?:-end)?$/.test((child as Comment).data)),
    );
  let node: Node = logicalChildren({ childNodes: roots } as unknown as ParentNode)[path[0]!]!;
  for (let i = 1; i < path.length; i++) {
    node = logicalChildren(node as ParentNode)[path[i]!]!;
  }
  return node;
}

export function getExistingItemNodes(cursor: ChildNode): { nodes: ChildNode[]; cursor: ChildNode | null } | null {
  let node = cursor.nextSibling;
  while (node && !(node.nodeType === Node.COMMENT_NODE && (node as Comment).data === 'loom:item')) {
    node = node.nextSibling;
  }
  if (!node) return null;
  const start = node;
  const nodes: ChildNode[] = [];
  node = start.nextSibling;
  while (node && !(node.nodeType === Node.COMMENT_NODE && (node as Comment).data === 'loom:item-end')) {
    nodes.push(node);
    node = node.nextSibling;
  }
  return node ? { nodes, cursor: node } : null;
}

/** Returns the existing top-level nodes immediately after a block anchor. */
export function getExistingNodes(anchor: ChildNode, count: number): ChildNode[] {
  const nodes: ChildNode[] = [];
  let node = anchor.nextSibling;
  while (node && nodes.length < count) {
    nodes.push(node);
    node = node.nextSibling;
  }
  return nodes;
}

export function cloneBlueprint(template: RootTemplate): DocumentFragment {
  return template.blueprint.cloneNode(true) as DocumentFragment;
}

/**
 * Wires every Binding/Block Record in `template` against `roots` (the
 * top-level nodes of a cloned blueprint, or a persisted roots array being
 * re-applied — see PRD §6.3 "same key, new reference"). Reactive bindings
 * register their `effect()` disposal, and event listeners register their
 * `removeEventListener`, in `bag`.
 */
export function applyBindings(
  template: RootTemplate,
  roots: ChildNode[],
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  assertTemplateShape(template, roots);
  for (const binding of template.bindings) {
    const node = getNodeAt(roots, binding.path);
    switch (binding.kind) {
      case 'text':
        bindText(binding, node as Text, scope, ctx, bag);
        break;
      case 'raw-html':
        bindRawHtml(binding, node as Comment, scope, ctx, bag);
        break;
      case 'attr-interp':
        bindAttrInterp(binding, node as Element, scope, ctx, bag);
        break;
      case 'prop-or-attr':
        bindPropOrAttr(binding, node as Element, scope, ctx, bag);
        break;
      case 'class':
        bindClass(binding, node as Element, scope, ctx, bag);
        break;
      case 'style':
        bindStyle(binding, node as HTMLElement | SVGElement, scope, ctx, bag);
        break;
      case 'event':
        bindEvent(binding, node as Element, scope, ctx, bag);
        break;
      case 'bind':
        bindInput(binding, node as HTMLInputElement, scope, ctx, bag);
        break;
      case 'action':
        bindAction(binding, node as Element, scope, ctx, bag);
        break;
    }
  }

  for (const block of template.blocks) {
    const anchor = getNodeAt(roots, block.path) as Comment;
    if (block.kind === 'if') {
      bindIf(block, anchor, scope, ctx, bag);
    } else if (block.kind === 'each') {
      bindEach(block, anchor, scope, ctx, bag);
    } else if (block.kind === 'switch') {
      bindSwitch(block, anchor, scope, ctx, bag);
    } else {
      bindPartial(block, anchor, scope, ctx, bag);
    }
  }
}

/** Validates only the structural contract owned by this template region. */
export function assertTemplateShape(template: RootTemplate, roots: ChildNode[]): void {
  const expectedRoots = Array.from(template.blueprint.childNodes);
  if (roots.length < expectedRoots.length || (template.blocks.length === 0 && roots.length !== expectedRoots.length)) {
    throw new Error(`Expected ${expectedRoots.length} nodes but found ${roots.length}.`);
  }
  for (let index = 0; index < expectedRoots.length; index++) {
    const expected = expectedRoots[index]!;
    const actual = roots[index]!;
    if (actual.nodeType !== expected.nodeType) throw new Error(`Node ${index} has an unexpected type.`);
    if (actual.nodeType === Node.ELEMENT_NODE && (actual as Element).tagName !== (expected as Element).tagName) {
      throw new Error(`Node ${index} expected <${(expected as Element).tagName.toLowerCase()}>.`);
    }
  }
  for (const binding of template.bindings) {
    const expected = getNodeAt(Array.from(template.blueprint.childNodes), binding.path);
    const actual = getNodeAt(roots, binding.path);
    if (actual.nodeType !== expected.nodeType)
      throw new Error(`Binding at ${binding.path.join('.')} has an unexpected node type.`);
    if (actual.nodeType === Node.ELEMENT_NODE && (actual as Element).tagName !== (expected as Element).tagName) {
      throw new Error(`Binding at ${binding.path.join('.')} targets an unexpected element.`);
    }
  }
}

export interface Instantiation {
  /** The template's original top-level nodes — stable, used for NodePath addressing (getNodeAt). */
  roots: ChildNode[];
  /**
   * The still-detached container holding `roots` *and* anything a
   * top-level {{#if}}/{{#each}} in this template inserted as their
   * siblings during `applyBindings` (via `anchor.after()`, which is a
   * no-op on a parentless node — the insertion only "took" because the
   * anchor's parent at that moment was this fragment). Callers must insert
   * `fragment` itself (e.g. `anchor.after(fragment)` / `container.append`),
   * not just `roots`, or those dynamically-inserted siblings are orphaned.
   */
  fragment: DocumentFragment;
}

/** Clones `template`'s blueprint and wires its bindings. See {@link Instantiation}. */
export function instantiate(template: RootTemplate, scope: Scope, ctx: RenderContext, bag: DisposalBag): Instantiation {
  const fragment = cloneBlueprint(template);
  const roots = Array.from(fragment.childNodes);
  applyBindings(template, roots, scope, ctx, bag);
  return { roots, fragment };
}
