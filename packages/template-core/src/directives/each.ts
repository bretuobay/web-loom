import { signal, computed, effect, batch, type WritableSignal } from '@web-loom/signals-core';
import { evaluate } from '../runtime/evaluate.js';
import { instantiate, applyBindings } from '../runtime/bindings.js';
import { DisposalBag } from '../runtime/disposal.js';
import type { BlockRecord, RenderContext, Scope } from '../types.js';

interface ItemInstance {
  key: unknown;
  itemRef: unknown;
  scope: Scope;
  indexSignal: WritableSignal<number>;
  nodes: ChildNode[];
  /** Set only until this instance's first insertion — see {@link instantiate}'s doc. */
  fragment: DocumentFragment | null;
  bag: DisposalBag;
}

/**
 * `{{#each}}` with keyed reconciliation (PRD §6.3). Two update paths coexist
 * by design:
 * - plain items + an immutable array write → this reconciler diffs by key,
 *   preserving DOM nodes for surviving keys and re-applying that instance's
 *   bindings in place (via `bag.reset()` + a fresh `applyBindings` pass
 *   against the *same* persisted nodes array) when the object behind a
 *   surviving key changed.
 * - items whose properties are themselves Signals → those bindings update
 *   through their own per-binding `effect()`, entirely independent of this
 *   block's outer effect, with zero diff work (Requirement 6.7).
 */
export function bindEach(
  block: Extract<BlockRecord, { kind: 'each' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const instances = new Map<unknown, ItemInstance>();
  const lengthSignal = signal(0);
  let emptyBag: DisposalBag | null = null;
  let emptyNodes: ChildNode[] = [];

  function keyOf(item: unknown, index: number): unknown {
    const itemScope: Scope = { parent: scope, self: item, locals: { '@index': index } };
    return evaluate(block.key, itemScope, ctx.helpers);
  }

  function createInstance(item: unknown, key: unknown, index: number): ItemInstance {
    const indexSignal = signal(index);
    const itemBag = bag.createChild();
    const itemScope: Scope = {
      parent: scope,
      self: item,
      locals: {
        '@index': indexSignal,
        '@first': computed(() => indexSignal.get() === 0),
        '@last': computed(() => indexSignal.get() === lengthSignal.get() - 1),
        '@even': computed(() => indexSignal.get() % 2 === 0),
        '@odd': computed(() => indexSignal.get() % 2 !== 0),
      },
    };
    const { roots, fragment } = instantiate(block.template, itemScope, ctx, itemBag);
    return { key, itemRef: item, scope: itemScope, indexSignal, nodes: roots, fragment, bag: itemBag };
  }

  function reconcile(items: unknown[]): void {
    lengthSignal.set(items.length);

    const newKeys = items.map((item, i) => keyOf(item, i));
    const newKeySet = new Set(newKeys);
    if (newKeySet.size !== newKeys.length) {
      throw new Error(
        `{{#each}} found duplicate keys among ${newKeys.length} items — "key=" values must be unique.`,
      );
    }

    for (const [key, inst] of instances) {
      if (!newKeySet.has(key)) {
        inst.bag.dispose();
        for (const node of inst.nodes) node.remove();
        instances.delete(key);
      }
    }

    let refNode: ChildNode = anchor;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = newKeys[i]!;
      let inst = instances.get(key);

      if (!inst) {
        inst = createInstance(item, key, i);
        instances.set(key, inst);
      } else {
        if (inst.itemRef !== item) {
          inst.itemRef = item;
          inst.scope.self = item;
          inst.bag.reset();
          applyBindings(block.template, inst.nodes, inst.scope, ctx, inst.bag);
        }
        if (inst.indexSignal.peek() !== i) {
          inst.indexSignal.set(i);
        }
      }

      if (inst.nodes.length > 0) {
        if (inst.fragment) {
          // First insertion: move the whole fragment, not just `nodes` — it
          // may also carry siblings a top-level nested {{#if}}/{{#each}}
          // inserted next to `nodes` while still detached (see instantiate).
          refNode.after(inst.fragment);
          inst.fragment = null;
        } else if (inst.nodes[0]!.previousSibling !== refNode) {
          refNode.after(...inst.nodes);
        }
        refNode = inst.nodes[inst.nodes.length - 1]!;
      }
    }

    if (items.length === 0 && block.empty) {
      if (!emptyBag) {
        emptyBag = bag.createChild();
        const { roots, fragment } = instantiate(block.empty, scope, ctx, emptyBag);
        emptyNodes = roots;
        anchor.after(fragment);
      }
    } else if (emptyBag) {
      emptyBag.dispose();
      for (const node of emptyNodes) node.remove();
      emptyBag = null;
      emptyNodes = [];
    }
  }

  const handle = effect(() => {
    const rawSource = evaluate(block.source, scope, ctx.helpers);
    const items: unknown[] = Array.isArray(rawSource) ? rawSource : [];
    batch(() => {
      reconcile(items);
    });
  });

  bag.add(() => {
    handle.dispose();
    for (const inst of instances.values()) {
      inst.bag.dispose();
      for (const node of inst.nodes) node.remove();
    }
    instances.clear();
    if (emptyBag) {
      emptyBag.dispose();
      for (const node of emptyNodes) node.remove();
    }
  });
}
