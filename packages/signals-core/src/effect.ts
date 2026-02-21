import { type Trackable, getCurrentEffect, setCurrentEffect } from './effect-context.js';

export interface EffectOptions {
  debugName?: string;
}

export interface EffectHandle {
  /** Stop the effect: run final cleanup and release all dependencies. */
  dispose(): void;
}

export type CleanupFn = () => void;
export type EffectFn = () => void | CleanupFn;

class EffectImpl {
  private _deps = new Set<Trackable>();
  private _cleanup: CleanupFn | void = undefined;
  private _disposed = false;
  readonly _boundRun: () => void;

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

    const saved = getCurrentEffect();
    setCurrentEffect({
      addDependency: (dep: Trackable) => {
        this._deps.add(dep);
        dep._addSub(this._boundRun);
      },
    });

    try {
      this._cleanup = this._fn();
    } finally {
      setCurrentEffect(saved);
    }
  }

  private _unsubscribeAll(): void {
    for (const dep of this._deps) dep._removeSub(this._boundRun);
    this._deps.clear();
  }
}

export function effect(fn: EffectFn, _options?: EffectOptions): EffectHandle {
  const impl = new EffectImpl(fn);
  return { dispose: () => impl.dispose() };
}
