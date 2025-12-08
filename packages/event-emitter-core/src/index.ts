type PropertyKeyOf<T> = Extract<keyof T, PropertyKey>;

export type EventRecord = Record<PropertyKey, unknown>;

export type EventArgs<TEvents extends EventRecord, TKey extends keyof TEvents> = TEvents[TKey] extends undefined | void
  ? []
  : TEvents[TKey] extends any[]
    ? TEvents[TKey]
    : [TEvents[TKey]];

export type EventListener<TEvents extends EventRecord, TKey extends keyof TEvents> = (
  ...payload: EventArgs<TEvents, TKey>
) => void;

export interface EventEmitterOptions<TEvents extends EventRecord> {
  onError?: (error: unknown, eventName: PropertyKeyOf<TEvents>) => void;
}

export class EventEmitter<TEvents extends EventRecord = Record<string, unknown>> {
  private listeners = new Map<PropertyKeyOf<TEvents>, Set<EventListener<TEvents, keyof TEvents>>>();
  private readonly reportError: (error: unknown, eventName: PropertyKeyOf<TEvents>) => void;

  constructor(options: EventEmitterOptions<TEvents> = {}) {
    this.reportError =
      options.onError ??
      ((error, eventName) => {
        console.error(`[event-emitter-core] Listener for "${String(eventName)}" failed`, error);
      });
  }

  on<TKey extends keyof TEvents>(eventName: TKey, listener: EventListener<TEvents, TKey>): () => void {
    const callbacks = this.getOrCreateListeners(eventName);
    callbacks.add(listener as EventListener<TEvents, keyof TEvents>);
    return () => this.off(eventName, listener);
  }

  subscribe<TKey extends keyof TEvents>(eventName: TKey, listener: EventListener<TEvents, TKey>): () => void {
    return this.on(eventName, listener);
  }

  once<TKey extends keyof TEvents>(eventName: TKey, listener: EventListener<TEvents, TKey>): () => void {
    const wrapped: EventListener<TEvents, TKey> = (...args) => {
      this.off(eventName, wrapped);
      listener(...args);
    };
    return this.on(eventName, wrapped);
  }

  off<TKey extends keyof TEvents>(eventName?: TKey, listener?: EventListener<TEvents, TKey>): void {
    if (eventName === undefined) {
      this.listeners.clear();
      return;
    }

    const callbacks = this.listeners.get(eventName);
    if (!callbacks) {
      return;
    }

    if (!listener) {
      this.listeners.delete(eventName);
      return;
    }

    callbacks.delete(listener as EventListener<TEvents, keyof TEvents>);
    if (callbacks.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  unsubscribe<TKey extends keyof TEvents>(eventName: TKey, listener?: EventListener<TEvents, TKey>): void {
    this.off(eventName, listener);
  }

  emit<TKey extends keyof TEvents>(eventName: TKey, ...payload: EventArgs<TEvents, TKey>): void {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks?.size) {
      return;
    }

    for (const callback of Array.from(callbacks)) {
      try {
        (callback as EventListener<TEvents, keyof TEvents>)(...payload);
      } catch (error) {
        this.reportError(error, eventName);
      }
    }
  }

  removeAllListeners(eventName?: keyof TEvents): void {
    if (eventName === undefined) {
      this.listeners.clear();
      return;
    }
    this.listeners.delete(eventName);
  }

  unsubscribeAll(eventName?: keyof TEvents): void {
    this.removeAllListeners(eventName);
  }

  removeAll(eventName?: keyof TEvents): void {
    this.removeAllListeners(eventName);
  }

  clear(): void {
    this.removeAllListeners();
  }

  listenerCount(eventName: keyof TEvents): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }

  hasListeners(eventName: keyof TEvents): boolean {
    return this.listenerCount(eventName) > 0;
  }

  eventNames(): Array<keyof TEvents> {
    return Array.from(this.listeners.keys());
  }

  private getOrCreateListeners<TKey extends keyof TEvents>(eventName: TKey) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    return this.listeners.get(eventName)!;
  }
}

export type EventSubscription = () => void;
