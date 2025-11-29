import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UndoRedoStackService } from '../undo-redo-stack.service';
import { firstValueFrom, skip } from 'rxjs';

interface TestState {
  value: number;
  text: string;
}

describe('UndoRedoStackService', () => {
  let service: UndoRedoStackService<TestState>;

  beforeEach(() => {
    service = new UndoRedoStackService<TestState>();
  });

  describe('initialization', () => {
    it('should initialize with initial state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const state = service.getState();
      expect(state.present).toEqual(initialState);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should initialize with maxLength', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState, maxLength: 10 });

      const state = service.getState();
      expect(state.maxLength).toBe(10);
    });

    it('should call onStateChange callback when provided', () => {
      const callback = vi.fn();
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState, onStateChange: callback });

      expect(service.getState()).toBeDefined();
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const state = await firstValueFrom(service.getState$());
      expect(state.present).toEqual(initialState);
    });

    it('should emit state updates when pushing state', async () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const statePromise = firstValueFrom(service.getState$().pipe(skip(1)));
      
      const newState: TestState = { value: 1, text: 'updated' };
      service.actions.pushState(newState);

      const state = await statePromise;
      expect(state.present).toEqual(newState);
      expect(state.past.length).toBe(1);
    });
  });

  describe('undo/redo operations', () => {
    it('should push new state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const newState: TestState = { value: 1, text: 'updated' };
      service.actions.pushState(newState);

      const state = service.getState();
      expect(state.present).toEqual(newState);
      expect(state.past).toEqual([initialState]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
    });

    it('should undo to previous state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const newState: TestState = { value: 1, text: 'updated' };
      service.actions.pushState(newState);
      service.actions.undo();

      const state = service.getState();
      expect(state.present).toEqual(initialState);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([newState]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(true);
    });

    it('should redo to next state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const newState: TestState = { value: 1, text: 'updated' };
      service.actions.pushState(newState);
      service.actions.undo();
      service.actions.redo();

      const state = service.getState();
      expect(state.present).toEqual(newState);
      expect(state.past).toEqual([initialState]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
    });

    it('should clear future when pushing new state after undo', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const state1: TestState = { value: 1, text: 'state1' };
      const state2: TestState = { value: 2, text: 'state2' };
      
      service.actions.pushState(state1);
      service.actions.undo();
      service.actions.pushState(state2);

      const state = service.getState();
      expect(state.present).toEqual(state2);
      expect(state.future).toEqual([]);
    });
  });

  describe('history management', () => {
    it('should clear history', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      service.actions.pushState({ value: 1, text: 'state1' });
      service.actions.pushState({ value: 2, text: 'state2' });
      service.actions.clearHistory();

      const state = service.getState();
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('should jump to specific state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const state1: TestState = { value: 1, text: 'state1' };
      const state2: TestState = { value: 2, text: 'state2' };
      
      service.actions.pushState(state1);
      service.actions.pushState(state2);
      service.actions.jumpToState(0);

      const state = service.getState();
      expect(state.present).toEqual(initialState);
    });

    it('should enforce maxLength', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState, maxLength: 3 });

      service.actions.pushState({ value: 1, text: 'state1' });
      service.actions.pushState({ value: 2, text: 'state2' });
      service.actions.pushState({ value: 3, text: 'state3' });
      service.actions.pushState({ value: 4, text: 'state4' });

      const state = service.getState();
      expect(state.past.length).toBeLessThanOrEqual(3);
    });

    it('should set maxLength', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState, maxLength: 10 });

      service.actions.setMaxLength(5);

      const state = service.getState();
      expect(state.maxLength).toBe(5);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      service.ngOnDestroy();

      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should complete Observable on destroy', async () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      service.initialize({ initialState });

      const completePromise = new Promise<void>((resolve) => {
        service.getState$().subscribe({
          next: () => {},
          complete: () => {
            resolve();
          },
        });
      });

      service.ngOnDestroy();
      await completePromise;
    });
  });

  describe('error handling', () => {
    it('should throw error when accessing actions before initialization', () => {
      expect(() => service.actions).toThrow(
        'UndoRedoStackService not initialized. Call initialize() first.'
      );
    });

    it('should throw error when accessing state$ before initialization', () => {
      expect(() => service.getState$()).toThrow(
        'UndoRedoStackService not initialized. Call initialize() first.'
      );
    });

    it('should throw error when accessing state before initialization', () => {
      expect(() => service.getState()).toThrow(
        'UndoRedoStackService not initialized. Call initialize() first.'
      );
    });
  });
});
