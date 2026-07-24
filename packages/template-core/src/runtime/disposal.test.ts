import { describe, expect, it, vi } from 'vitest';
import { DisposalBag } from './disposal.js';

describe('DisposalBag', () => {
  it('runs teardowns in reverse registration order', () => {
    const order: number[] = [];
    const bag = new DisposalBag();
    bag.add(() => order.push(1));
    bag.add(() => order.push(2));
    bag.add(() => order.push(3));
    bag.dispose();
    expect(order).toEqual([3, 2, 1]);
  });

  it('is idempotent — a second dispose() is a no-op', () => {
    const fn = vi.fn();
    const bag = new DisposalBag();
    bag.add(fn);
    bag.dispose();
    bag.dispose();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs a teardown immediately if added after disposal', () => {
    const fn = vi.fn();
    const bag = new DisposalBag();
    bag.dispose();
    bag.add(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('add() returns an unregister function', () => {
    const fn = vi.fn();
    const bag = new DisposalBag();
    const unregister = bag.add(fn);
    unregister();
    bag.dispose();
    expect(fn).not.toHaveBeenCalled();
  });

  it('aggregates errors from multiple failing teardowns without stopping the rest', () => {
    const order: number[] = [];
    const bag = new DisposalBag();
    bag.add(() => order.push(1));
    bag.add(() => {
      throw new Error('boom-2');
    });
    bag.add(() => order.push(3));
    bag.add(() => {
      throw new Error('boom-4');
    });
    expect(() => bag.dispose()).toThrow(AggregateError);
    expect(order).toEqual([3, 1]);
  });

  it('reset() runs teardowns but keeps the bag usable', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const bag = new DisposalBag();
    bag.add(fn1);
    bag.reset();
    expect(fn1).toHaveBeenCalledTimes(1);
    bag.add(fn2);
    bag.dispose();
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  describe('createChild', () => {
    it('disposes children when the parent disposes', () => {
      const fn = vi.fn();
      const parent = new DisposalBag();
      const child = parent.createChild();
      child.add(fn);
      parent.dispose();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('a child disposed independently does not get double-disposed by the parent', () => {
      const fn = vi.fn();
      const parent = new DisposalBag();
      const child = parent.createChild();
      child.add(fn);
      child.dispose();
      expect(fn).toHaveBeenCalledTimes(1);
      parent.dispose(); // should not re-run the child's already-run teardown
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('disposing the parent leaves other children unaffected before their own turn', () => {
      const parent = new DisposalBag();
      const childA = parent.createChild();
      const childB = parent.createChild();
      const fnA = vi.fn();
      const fnB = vi.fn();
      childA.add(fnA);
      childB.add(fnB);
      parent.dispose();
      expect(fnA).toHaveBeenCalledTimes(1);
      expect(fnB).toHaveBeenCalledTimes(1);
    });

    it('disposes many children without mutate-while-iterating corruption (regression)', () => {
      // Each child's own disposal calls the unregister function it registered
      // on the parent, which splices the *parent's* teardowns array — while
      // the parent's dispose() may still be mid-iteration over that same
      // array. A live-array iteration corrupts indices at this scale; a
      // snapshot-then-iterate approach does not.
      const parent = new DisposalBag();
      const fns = Array.from({ length: 1000 }, () => vi.fn());
      const children = fns.map((fn) => {
        const child = parent.createChild();
        child.add(fn);
        return child;
      });
      expect(() => parent.dispose()).not.toThrow();
      for (const fn of fns) {
        expect(fn).toHaveBeenCalledTimes(1);
      }
      for (const child of children) {
        expect(() => child.dispose()).not.toThrow(); // already disposed — idempotent
      }
    });
  });
});
