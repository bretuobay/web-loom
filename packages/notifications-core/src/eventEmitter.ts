type Callback<T> = (payload: T) => void;

export class EventEmitter<TEvents extends Record<string, unknown>> {
  private listeners: Map<keyof TEvents, Set<Callback<any>>> = new Map();

  subscribe<TKey extends keyof TEvents>(eventName: TKey, callback: Callback<TEvents[TKey]>): () => void {
    const callbacks = this.listeners.get(eventName) ?? new Set();
    callbacks.add(callback as Callback<any>);
    this.listeners.set(eventName, callbacks);
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  emit<TKey extends keyof TEvents>(eventName: TKey, payload: TEvents[TKey]): void {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks?.size) {
      return;
    }
    callbacks.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`[notifications-core] Listener for "${String(eventName)}" failed`, error);
      }
    });
  }

  unsubscribe<TKey extends keyof TEvents>(eventName: TKey, callback?: Callback<TEvents[TKey]>): void {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) {
      return;
    }

    if (!callback) {
      callbacks.clear();
      return;
    }

    callbacks.delete(callback as Callback<any>);
    if (callbacks.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  unsubscribeAll() {
    this.listeners.clear();
  }
}
