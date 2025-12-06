type Listener<Payload> = (payload: Payload) => void;

export class TypedEventEmitter<EventMap extends Record<string, any>> {
  private listeners = new Map<keyof EventMap, Set<Listener<any>>>();

  on<EventName extends keyof EventMap>(event: EventName, handler: Listener<EventMap[EventName]>): () => void {
    this.getListeners(event).add(handler);
    return () => this.off(event, handler);
  }

  once<EventName extends keyof EventMap>(event: EventName, handler: Listener<EventMap[EventName]>): () => void {
    const wrapped: Listener<EventMap[EventName]> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  off<EventName extends keyof EventMap>(event: EventName, handler: Listener<EventMap[EventName]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<EventName extends keyof EventMap>(event: EventName, payload: EventMap[EventName]): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    for (const listener of Array.from(set)) {
      listener(payload);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }

  private getListeners<EventName extends keyof EventMap>(event: EventName): Set<Listener<any>> {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    return this.listeners.get(event)!;
  }
}
