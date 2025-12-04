import { describe, it, expect, vi } from 'vitest';
import { TypedEventEmitter } from './event-emitter.js';

interface TestEvents {
  ping: { value: number };
  pong: void;
}

describe('TypedEventEmitter', () => {
  it('invokes listeners registered via on and supports off', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = emitter.on('ping', listener);

    emitter.emit('ping', { value: 42 });
    expect(listener).toHaveBeenCalledWith({ value: 42 });

    unsubscribe();
    emitter.emit('ping', { value: 7 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('only fires once listeners a single time', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.once('ping', listener);

    emitter.emit('ping', { value: 1 });
    emitter.emit('ping', { value: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clears listeners via removeAll', () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('pong', listener);
    emitter.removeAll();
    emitter.emit('pong', undefined);
    expect(listener).not.toHaveBeenCalled();
  });
});
