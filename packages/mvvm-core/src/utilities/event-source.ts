/**
 * A minimal event stream: subscribers receive every emitted value, including
 * repeats. Unlike a signal, an event source has no current value and never
 * dedupes — use it for occurrence-shaped facts (item added, error raised),
 * not for state.
 */
export interface EventSubscribable<T> {
  subscribe(fn: (value: T) => void): () => void;
}

export class EventSource<T> implements EventSubscribable<T> {
  private _subs = new Set<(value: T) => void>();
  private _isDisposed = false;

  subscribe(fn: (value: T) => void): () => void {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }

  emit(value: T): void {
    if (this._isDisposed) return;
    for (const sub of [...this._subs]) sub(value);
  }

  /** Stop delivering events and drop all subscribers. */
  dispose(): void {
    this._isDisposed = true;
    this._subs.clear();
  }
}
