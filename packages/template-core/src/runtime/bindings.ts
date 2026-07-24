import { bindText, bindRawHtml } from '../directives/text.js';
import { bindAttrInterp, bindPropOrAttr } from '../directives/attributes.js';
import { bindClass } from '../directives/classes.js';
import { bindStyle } from '../directives/styles.js';
import { bindEvent } from '../directives/events.js';
import { bindIf } from '../directives/if.js';
import { bindEach } from '../directives/each.js';
import { DisposalBag } from './disposal.js';
import type { NodePath, RenderContext, RootTemplate, Scope } from '../types.js';

/** Resolves a NodePath (child-index address) against a persisted roots array. */
export function getNodeAt(roots: ChildNode[], path: NodePath): Node {
  let node: Node = roots[path[0]!]!;
  for (let i = 1; i < path.length; i++) {
    node = node.childNodes[path[i]!]!;
  }
  return node;
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
    }
  }

  for (const block of template.blocks) {
    const anchor = getNodeAt(roots, block.path) as Comment;
    if (block.kind === 'if') {
      bindIf(block, anchor, scope, ctx, bag);
    } else {
      bindEach(block, anchor, scope, ctx, bag);
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
