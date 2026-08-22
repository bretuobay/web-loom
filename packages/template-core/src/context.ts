import { computed, type ReadonlySignal } from '@web-loom/signals-core';

/**
 * Merges independently-built context parts (ViewModels, forms, helpers,
 * actions) into the single object a template mounts against, preserving each
 * part's inferred type. Throws on duplicate keys so two parts can never
 * silently shadow each other — the failure mode a hand-grown bindings class
 * hides until a template renders the wrong data.
 */
export function composeContext<TParts extends readonly object[]>(...parts: TParts): Intersect<TParts[number]> {
  const merged: Record<string, unknown> = {};
  for (const part of parts) {
    for (const key of Object.keys(part)) {
      if (key in merged) {
        throw new Error(`composeContext received duplicate context key "${key}".`);
      }
      merged[key] = (part as Record<string, unknown>)[key];
    }
  }
  return merged as Intersect<TParts[number]>;
}

type Intersect<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Derived "is anything still loading" signal over any set of ViewModels.
 * Listing the ViewModels once at the call site replaces the hand-maintained
 * `a.isLoading$.get() || b.isLoading$.get() || …` chain that must otherwise be
 * edited every time a ViewModel joins a view.
 */
export function anyLoading(...vms: ReadonlyArray<{ isLoading$: ReadonlySignal<unknown> }>): ReadonlySignal<boolean> {
  return computed(() => vms.some((vm) => Boolean(vm.isLoading$.get())));
}

/** Derived signal holding the first truthy `error$` across the given ViewModels, or `null`. */
export function firstError(...vms: ReadonlyArray<{ error$: ReadonlySignal<unknown> }>): ReadonlySignal<unknown> {
  return computed(() => {
    for (const vm of vms) {
      const error = vm.error$.get();
      if (error) return error;
    }
    return null;
  });
}
