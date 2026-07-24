/**
 * Ordered teardown container (PRD §7.1 lifecycle). Effects, event listeners,
 * and nested branch/item bags all register a teardown here; `dispose()` runs
 * them in reverse registration order and is idempotent. `reset()` runs the
 * same teardowns but leaves the bag reusable — used when a keyed `{{#each}}`
 * item's underlying object reference changes and its bindings need to be
 * re-applied to the same, still-mounted DOM nodes (PRD §6.3).
 */
export class DisposalBag {
  private teardowns: Array<() => void> = [];
  private disposed = false;

  /** Registers a teardown callback. Returns an unregister function. */
  add(fn: () => void): () => void {
    if (this.disposed) {
      fn();
      return () => {};
    }
    this.teardowns.push(fn);
    return () => {
      const idx = this.teardowns.indexOf(fn);
      if (idx !== -1) this.teardowns.splice(idx, 1);
    };
  }

  /** Creates a child bag whose disposal is registered with this bag. */
  createChild(): DisposalBag {
    const child = new DisposalBag();
    const unregister = this.add(() => child.dispose());
    child.add(unregister);
    return child;
  }

  /** Runs all teardowns but leaves the bag usable for further `add()` calls. */
  reset(): void {
    this.runTeardowns();
  }

  /** Runs all teardowns and permanently marks the bag as disposed. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.runTeardowns();
  }

  private runTeardowns(): void {
    // Swap in a fresh array *before* running anything: a teardown here can
    // itself call `add()` or an unregister function that mutates
    // `this.teardowns` (e.g. a child bag's own disposal unregistering
    // itself from this bag, per `createChild`). Iterating the live array
    // while such a mutation splices it would skip entries or read past the
    // (now shorter) array — snapshotting first makes that impossible.
    const snapshot = this.teardowns;
    this.teardowns = [];
    const errors: unknown[] = [];
    for (let i = snapshot.length - 1; i >= 0; i--) {
      try {
        snapshot[i]!();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Errors occurred while disposing a DisposalBag');
  }
}
