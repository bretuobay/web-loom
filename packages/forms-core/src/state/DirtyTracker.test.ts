import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { DirtyTracker, FieldDirtyTracker } from './DirtyTracker';

describe('DirtyTracker', () => {
  let tracker: DirtyTracker<{ name: string; age: number }>;

  beforeEach(() => {
    tracker = new DirtyTracker();
  });

  describe('initial state', () => {
    it('should not be dirty initially', () => {
      expect(tracker.isDirty).toBe(false);
    });
  });

  describe('setInitialValue', () => {
    it('should set initial value and mark clean', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });

      expect(tracker.isDirty).toBe(false);
      expect(tracker.getInitialValue()).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('setCurrentValue', () => {
    it('should mark dirty when value differs from initial', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });

      expect(tracker.isDirty).toBe(true);
    });

    it('should mark clean when value equals initial', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });
      tracker.setCurrentValue({ name: 'John', age: 30 });

      expect(tracker.isDirty).toBe(false);
    });
  });

  describe('trackObservable', () => {
    it('should treat first emission as initial value', () => {
      const source$ = new BehaviorSubject({ name: 'John', age: 30 });
      tracker.trackObservable(source$);

      expect(tracker.isDirty).toBe(false);
      expect(tracker.getInitialValue()).toEqual({ name: 'John', age: 30 });
    });

    it('should track subsequent emissions as current value', () => {
      const source$ = new BehaviorSubject({ name: 'John', age: 30 });
      tracker.trackObservable(source$);

      source$.next({ name: 'Jane', age: 30 });

      expect(tracker.isDirty).toBe(true);
    });

    it('should not treat first emission as initial when treatFirstAsInitial is false', () => {
      const source$ = new BehaviorSubject({ name: 'John', age: 30 });
      tracker.setInitialValue({ name: 'Initial', age: 0 });
      tracker.trackObservable(source$, false);

      expect(tracker.isDirty).toBe(true);
      expect(tracker.getInitialValue()).toEqual({ name: 'Initial', age: 0 });
    });
  });

  describe('markClean', () => {
    it('should mark clean and update initial value', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });

      tracker.markClean();

      expect(tracker.isDirty).toBe(false);
      expect(tracker.getInitialValue()).toEqual({ name: 'Jane', age: 30 });
    });
  });

  describe('markDirty', () => {
    it('should force dirty state', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.markDirty();

      expect(tracker.isDirty).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to initial value', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 25 });

      const resetValue = tracker.reset();

      expect(resetValue).toEqual({ name: 'John', age: 30 });
      expect(tracker.isDirty).toBe(false);
    });
  });

  describe('hasChanged', () => {
    it('should detect if a value differs from initial', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });

      expect(tracker.hasChanged({ name: 'John', age: 30 })).toBe(false);
      expect(tracker.hasChanged({ name: 'Jane', age: 30 })).toBe(true);
    });
  });

  describe('getCurrentValue', () => {
    it('should return current value', () => {
      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 25 });

      expect(tracker.getCurrentValue()).toEqual({ name: 'Jane', age: 25 });
    });
  });

  describe('isDirty$', () => {
    it('should emit on dirty state changes', async () => {
      const emissions: boolean[] = [];
      tracker.isDirty$.subscribe(v => emissions.push(v));

      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });
      tracker.markClean();

      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(emissions).toContain(true);
      expect(emissions[emissions.length - 1]).toBe(false);
    });

    it('should not emit duplicate values', async () => {
      const emissions: boolean[] = [];
      tracker.isDirty$.subscribe(v => emissions.push(v));

      tracker.setInitialValue({ name: 'John', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });
      tracker.setCurrentValue({ name: 'Jane', age: 30 });

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const trueCount = emissions.filter(v => v === true).length;
      expect(trueCount).toBe(1);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      const source$ = new BehaviorSubject({ name: 'John', age: 30 });
      tracker.trackObservable(source$);

      tracker.dispose();

      // Should not throw
      expect(() => source$.next({ name: 'Jane', age: 30 })).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values', () => {
      const tracker = new DirtyTracker<string | undefined>();
      tracker.setInitialValue(undefined);
      tracker.setCurrentValue('test');

      expect(tracker.isDirty).toBe(true);
    });

    it('should handle null values', () => {
      const tracker = new DirtyTracker<string | null>();
      tracker.setInitialValue(null);
      tracker.setCurrentValue('test');

      expect(tracker.isDirty).toBe(true);
    });

    it('should handle primitive values', () => {
      const tracker = new DirtyTracker<number>();
      tracker.setInitialValue(42);
      tracker.setCurrentValue(43);

      expect(tracker.isDirty).toBe(true);
    });

    it('should handle nested objects', () => {
      const tracker = new DirtyTracker<{ user: { name: string } }>();
      tracker.setInitialValue({ user: { name: 'John' } });
      tracker.setCurrentValue({ user: { name: 'Jane' } });

      expect(tracker.isDirty).toBe(true);
    });
  });
});

describe('FieldDirtyTracker', () => {
  let tracker: FieldDirtyTracker<{ name: string; email: string; age: number }>;

  beforeEach(() => {
    tracker = new FieldDirtyTracker();
    tracker.setInitialValue({ name: 'John', email: 'john@test.com', age: 30 });
  });

  describe('isFieldDirty', () => {
    it('should detect dirty field', () => {
      tracker.setCurrentValue({ name: 'Jane', email: 'john@test.com', age: 30 });

      expect(tracker.isFieldDirty('name')).toBe(true);
      expect(tracker.isFieldDirty('email')).toBe(false);
      expect(tracker.isFieldDirty('age')).toBe(false);
    });

    it('should return false when no values set', () => {
      const newTracker = new FieldDirtyTracker<{ name: string }>();
      expect(newTracker.isFieldDirty('name')).toBe(false);
    });
  });

  describe('getDirtyFields', () => {
    it('should return all dirty fields', () => {
      tracker.setCurrentValue({ name: 'Jane', email: 'jane@test.com', age: 30 });

      const dirtyFields = tracker.getDirtyFields();

      expect(dirtyFields).toContain('name');
      expect(dirtyFields).toContain('email');
      expect(dirtyFields).not.toContain('age');
    });

    it('should return empty array when no fields are dirty', () => {
      const dirtyFields = tracker.getDirtyFields();
      expect(dirtyFields).toEqual([]);
    });

    it('should return empty array when no values set', () => {
      const newTracker = new FieldDirtyTracker<{ name: string }>();
      expect(newTracker.getDirtyFields()).toEqual([]);
    });
  });

  describe('getChanges', () => {
    it('should return only changed fields', () => {
      tracker.setCurrentValue({ name: 'Jane', email: 'john@test.com', age: 25 });

      const changes = tracker.getChanges();

      expect(changes).toEqual({ name: 'Jane', age: 25 });
      expect(changes).not.toHaveProperty('email');
    });

    it('should return empty object when no fields are dirty', () => {
      const changes = tracker.getChanges();
      expect(changes).toEqual({});
    });

    it('should handle nested object changes', () => {
      const tracker = new FieldDirtyTracker<{ user: { name: string }; count: number }>();
      tracker.setInitialValue({ user: { name: 'John' }, count: 1 });
      tracker.setCurrentValue({ user: { name: 'Jane' }, count: 1 });

      const changes = tracker.getChanges();

      expect(changes).toEqual({ user: { name: 'Jane' } });
      expect(changes).not.toHaveProperty('count');
    });
  });

  describe('dirtyFields$', () => {
    it('should emit dirty fields when state changes', async () => {
      const emissions: Array<Array<keyof typeof tracker>> = [];
      tracker.dirtyFields$.subscribe(fields => emissions.push(fields));

      tracker.setCurrentValue({ name: 'Jane', email: 'john@test.com', age: 30 });

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const lastEmission = emissions[emissions.length - 1];
      expect(lastEmission).toContain('name');
      expect(lastEmission).not.toContain('email');
    });
  });

  describe('field equality', () => {
    it('should handle undefined field values', () => {
      const tracker = new FieldDirtyTracker<{ name?: string }>();
      tracker.setInitialValue({ name: undefined });
      tracker.setCurrentValue({ name: 'test' });

      expect(tracker.isFieldDirty('name')).toBe(true);
    });

    it('should handle null field values', () => {
      const tracker = new FieldDirtyTracker<{ name: string | null }>();
      tracker.setInitialValue({ name: null });
      tracker.setCurrentValue({ name: 'test' });

      expect(tracker.isFieldDirty('name')).toBe(true);
    });

    it('should handle nested object field values', () => {
      const tracker = new FieldDirtyTracker<{ address: { city: string } }>();
      tracker.setInitialValue({ address: { city: 'NYC' } });
      tracker.setCurrentValue({ address: { city: 'LA' } });

      expect(tracker.isFieldDirty('address')).toBe(true);
    });
  });
});
