import { describe, it, expect, vi } from 'vitest';
import { Subject, BehaviorSubject } from 'rxjs';
import { signal } from './signal.js';
import { toObservable, fromObservable } from './rxjs.js';

describe('toObservable', () => {
  it('emits the current value immediately on subscribe (BehaviorSubject semantics)', () => {
    const s = signal(7);
    const values: number[] = [];
    toObservable(s).subscribe((v) => values.push(v));
    expect(values).toEqual([7]);
  });

  it('emits on every signal change', () => {
    const s = signal('a');
    const values: string[] = [];
    toObservable(s).subscribe((v) => values.push(v));
    s.set('b');
    s.set('c');
    expect(values).toEqual(['a', 'b', 'c']);
  });

  it('stops emitting after unsubscribe', () => {
    const s = signal(0);
    const values: number[] = [];
    const sub = toObservable(s).subscribe((v) => values.push(v));
    sub.unsubscribe();
    s.set(1);
    expect(values).toEqual([0]);
  });
});

describe('fromObservable', () => {
  it('holds the initial value until the first emission', () => {
    const subject = new Subject<number>();
    const s = fromObservable(subject, -1);
    expect(s.get()).toBe(-1);
    subject.next(5);
    expect(s.get()).toBe(5);
  });

  it('picks up the current value of a BehaviorSubject immediately', () => {
    const subject = new BehaviorSubject(10);
    const s = fromObservable(subject, 0);
    expect(s.get()).toBe(10);
  });

  it('notifies signal subscribers with new values', () => {
    const subject = new Subject<string>();
    const s = fromObservable(subject, '');
    const fn = vi.fn();
    s.subscribe(fn);
    subject.next('hello');
    expect(fn).toHaveBeenCalledWith('hello');
  });

  it('dispose unsubscribes from the source', () => {
    const subject = new Subject<number>();
    const s = fromObservable(subject, 0);
    s.dispose();
    subject.next(99);
    expect(s.peek()).toBe(0);
    expect(subject.observed).toBe(false);
  });

  it('routes errors to the onError callback', () => {
    const subject = new Subject<number>();
    const onError = vi.fn();
    fromObservable(subject, 0, onError);
    const boom = new Error('boom');
    subject.error(boom);
    expect(onError).toHaveBeenCalledWith(boom);
  });
});
