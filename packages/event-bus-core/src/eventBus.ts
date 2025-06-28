import { EventBus, EventMap, Listener, GenericListener } from './types';

class EventBusImpl<M extends EventMap> implements EventBus<M> {
  private listeners: Map<keyof M, Set<GenericListener>> = new Map();

  on<K extends keyof M>(event: K | K[], listener: Listener<K, M>): void {
    const eventNames = Array.isArray(event) ? event : [event];
    eventNames.forEach(eventName => {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      this.listeners.get(eventName)!.add(listener as GenericListener);
    });
  }

  once<K extends keyof M>(event: K, listener: Listener<K, M>): void {
    const onceListener: GenericListener = (...args: any[]) => {
      this.off(event, onceListener as Listener<K,M>);
      (listener as GenericListener)(...args);
    };
    this.on(event, onceListener as Listener<K,M>);
  }

  off<K extends keyof M>(event?: K, listener?: Listener<K, M> | GenericListener): void {
    if (!event) {
      // Unregister all listeners for all events
      this.listeners.clear();
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    if (!listener) {
      // Unregister all listeners for the specific event
      this.listeners.delete(event);
      return;
    }

    // Unregister a specific listener for the specific event
    eventListeners.delete(listener as GenericListener);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<K extends keyof M>(event: K, ...args: M[K] extends any[] ? M[K] : []): void;
  emit(event: string, ...args: any[]): void {
    const eventListenersSet = this.listeners.get(event as keyof M);
    if (eventListenersSet && eventListenersSet.size > 0) {
      // Create a stable array copy for this emission cycle
      const listenersToExecute = Array.from(eventListenersSet);
      for (let i = 0; i < listenersToExecute.length; i++) {
        const listener = listenersToExecute[i];
        listener(...args);
      }
    }
  }
}

export function createEventBus<M extends EventMap>(): EventBus<M> {
  return new EventBusImpl<M>();
}
