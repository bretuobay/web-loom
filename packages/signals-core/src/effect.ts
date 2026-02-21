import { Signal } from './signal.js';
import { Computed } from './computed.js';
import { getCurrentEffect, setCurrentEffect } from './effect-context.js';

export type CleanupFn = () => void;
export type EffectFn = () => void | CleanupFn;

type Dep = Signal<unknown> | Computed<unknown>;

export class Effect {
  private _deps = new Set<Dep>();
  private _cleanup: CleanupFn | void = undefined;
  private _disposed = false;
  // Stored as a property so deps can hold a stable reference
  readonly _boundRun: (value?: unknown) => void;

  constructor(private readonly _fn: EffectFn) {
    this._boundRun = () => this._run();
    this._run();
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._cleanup?.();
    this._cleanup = undefined;
    this._unsubscribeAll();
  }

  private _run(): void {
    if (this._disposed) return;

    this._cleanup?.();
    this._cleanup = undefined;
    this._unsubscribeAll();

    const savedEffect = getCurrentEffect();

    setCurrentEffect({
      addDependency: (dep: unknown) => {
        const d = dep as Dep;
        this._deps.add(d);
        d._addSub(this._boundRun);
      },
      invalidate: () => this._run(),
    });

    try {
      this._cleanup = this._fn();
    } finally {
      setCurrentEffect(savedEffect);
    }
  }

  private _unsubscribeAll(): void {
    for (const dep of this._deps) {
      dep._removeSub(this._boundRun);
    }
    this._deps.clear();
  }
}

export function effect(fn: EffectFn): () => void {
  const e = new Effect(fn);
  return () => e.dispose();
}
