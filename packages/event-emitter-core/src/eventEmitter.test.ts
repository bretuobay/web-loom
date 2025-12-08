import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from './index.js';

interface DemoEvents extends Record<PropertyKey, unknown> {
  ready: void;
  count: number;
  complex: [id: string, payload: { ok: boolean }];
  optional?: void;
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<DemoEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<DemoEvents>();
  });

  it('invokes listeners registered with on', () => {
    const spy = vi.fn();
    emitter.on('count', spy);
    emitter.emit('count', 5);
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('allows multiple listeners and deduplicates the same function', () => {
    const spy = vi.fn();
    emitter.on('ready', spy);
    emitter.on('ready', spy);
    const another = vi.fn();
    emitter.on('ready', another);
    emitter.emit('ready');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(another).toHaveBeenCalledTimes(1);
  });

  it('supports tuple payloads', () => {
    const spy = vi.fn();
    emitter.on('complex', spy);
    emitter.emit('complex', 'id', { ok: true });
    expect(spy).toHaveBeenCalledWith('id', { ok: true });
  });

  it('returns an unsubscribe function from on', () => {
    const spy = vi.fn();
    const unsub = emitter.on('count', spy);
    emitter.emit('count', 1);
    unsub();
    emitter.emit('count', 2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('exposes subscribe/unsubscribe aliases', () => {
    const spy = vi.fn();
    const unsub = emitter.subscribe('ready', spy);
    emitter.emit('ready');
    unsub();
    emitter.emit('ready');
    expect(spy).toHaveBeenCalledTimes(1);
    emitter.unsubscribe('ready', spy);
  });

  it('supports once listeners', () => {
    const spy = vi.fn();
    emitter.once('count', spy);
    emitter.emit('count', 1);
    emitter.emit('count', 2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('off removes specific listeners', () => {
    const keep = vi.fn();
    const remove = vi.fn();
    emitter.on('count', keep);
    emitter.on('count', remove);
    emitter.off('count', remove);
    emitter.emit('count', 3);
    expect(keep).toHaveBeenCalledWith(3);
    expect(remove).not.toHaveBeenCalled();
  });

  it('off without listener removes entire event', () => {
    const spy = vi.fn();
    emitter.on('count', spy);
    emitter.off('count');
    emitter.emit('count', 2);
    expect(spy).not.toHaveBeenCalled();
  });

  it('off without args clears every listener', () => {
    const spy = vi.fn();
    emitter.on('count', spy);
    emitter.on('ready', spy);
    emitter.off();
    emitter.emit('count', 1);
    emitter.emit('ready');
    expect(spy).not.toHaveBeenCalled();
  });

  it('removeAllListeners clears the targeted event', () => {
    const spy = vi.fn();
    emitter.on('count', spy);
    emitter.removeAllListeners('count');
    emitter.emit('count', 4);
    expect(spy).not.toHaveBeenCalled();
  });

  it('clear removes all listeners', () => {
    const spy = vi.fn();
    emitter.on('count', spy);
    emitter.clear();
    emitter.emit('count', 10);
    expect(spy).not.toHaveBeenCalled();
  });

  it('tracks listenerCount and hasListeners', () => {
    const spy = vi.fn();
    expect(emitter.listenerCount('count')).toBe(0);
    expect(emitter.hasListeners('count')).toBe(false);
    emitter.on('count', spy);
    expect(emitter.listenerCount('count')).toBe(1);
    expect(emitter.hasListeners('count')).toBe(true);
  });

  it('lists active event names', () => {
    emitter.on('ready', vi.fn());
    emitter.on('count', vi.fn());
    expect(new Set(emitter.eventNames())).toEqual(new Set(['ready', 'count']));
  });

  it('emits using empty payload for void events', () => {
    const spy = vi.fn();
    emitter.on('ready', spy);
    emitter.emit('ready');
    expect(spy).toHaveBeenCalled();
  });

  it('ignores emissions when no listeners exist', () => {
    expect(() => emitter.emit('count', 5)).not.toThrow();
  });

  it('recovers from listener errors with default logger', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    emitter.on('count', () => {
      throw new Error('boom');
    });
    expect(() => emitter.emit('count', 1)).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('supports custom error reporter', () => {
    const reporter = vi.fn();
    const localEmitter = new EventEmitter<DemoEvents>({ onError: reporter });
    localEmitter.on('count', () => {
      throw new Error('boom');
    });
    localEmitter.emit('count', 2);
    expect(reporter).toHaveBeenCalledWith(expect.any(Error), 'count');
  });

  it('unsubscribeAll alias removes listeners', () => {
    const spy = vi.fn();
    emitter.on('count', spy);
    emitter.unsubscribeAll('count');
    emitter.emit('count', 1);
    expect(spy).not.toHaveBeenCalled();
  });
});
