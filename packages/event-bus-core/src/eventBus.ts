import { EventEmitter } from '@web-loom/event-emitter-core';
import { EventBus, EventMap, Listener, GenericListener } from './types';

class EventBusImpl<M extends EventMap> implements EventBus<M> {
  private emitter = new EventEmitter<M>();

  on<K extends keyof M>(event: K | K[], listener: Listener<K, M>): void {
    const eventNames = Array.isArray(event) ? event : [event];
    eventNames.forEach((eventName) => {
      this.emitter.on(eventName, listener as GenericListener);
    });
  }

  once<K extends keyof M>(event: K, listener: Listener<K, M>): void {
    this.emitter.once(event, listener as GenericListener);
  }

  off<K extends keyof M>(event?: K, listener?: Listener<K, M> | GenericListener): void {
    if (!event) {
      this.emitter.removeAllListeners();
      return;
    }

    if (!listener) {
      this.emitter.removeAllListeners(event);
      return;
    }

    this.emitter.off(event, listener as GenericListener);
  }

  emit<K extends keyof M>(event: K, ...args: M[K] extends any[] ? M[K] : []): void;
  emit(event: string, ...args: any[]): void {
    (this.emitter.emit as any)(event, ...args);
  }
}

export function createEventBus<M extends EventMap>(): EventBus<M> {
  return new EventBusImpl<M>();
}
