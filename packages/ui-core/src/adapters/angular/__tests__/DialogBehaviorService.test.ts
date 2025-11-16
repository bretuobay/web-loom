import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DialogBehaviorService } from '../index';
import { firstValueFrom } from 'rxjs';

describe('DialogBehaviorService', () => {
  let service: DialogBehaviorService;

  beforeEach(() => {
    service = new DialogBehaviorService();
  });

  describe('initialization', () => {
    it('should initialize with closed state', () => {
      service.initialize();

      const state = service.getState();
      expect(state.isOpen).toBe(false);
      expect(state.content).toBeNull();
      expect(state.id).toBeNull();
    });

    it('should initialize with provided id', () => {
      service.initialize({ id: 'test-dialog' });

      const state = service.getState();
      expect(state.id).toBe('test-dialog');
      expect(state.isOpen).toBe(false);
    });

    it('should throw error when accessing actions before initialization', () => {
      expect(() => service.actions).toThrow(
        'DialogBehaviorService not initialized. Call initialize() first.'
      );
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize();

      const state = await firstValueFrom(service.getState$());
      expect(state.isOpen).toBe(false);
      expect(state.content).toBeNull();
    });

    it('should emit state updates when opening dialog', (done) => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 1) {
          // Initial state
          expect(state.isOpen).toBe(false);
        } else if (emissionCount === 2) {
          // After opening
          expect(state.isOpen).toBe(true);
          expect(state.content).toEqual({ title: 'Test Dialog' });
          done();
        }
      });

      service.actions.open({ title: 'Test Dialog' });
    });

    it('should emit state updates when closing dialog', (done) => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 3) {
          // After closing
          expect(state.isOpen).toBe(false);
          expect(state.content).toBeNull();
          done();
        }
      });

      service.actions.open({ title: 'Test' });
      service.actions.close();
    });

    it('should emit state updates when toggling dialog', (done) => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.isOpen).toBe(true);
        } else if (emissionCount === 3) {
          expect(state.isOpen).toBe(false);
          done();
        }
      });

      service.actions.toggle({ title: 'Toggle Test' });
      service.actions.toggle();
    });

    it('should handle multiple state updates', (done) => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.content).toEqual({ step: 1 });
        } else if (emissionCount === 3) {
          expect(state.content).toEqual({ step: 2 });
        } else if (emissionCount === 4) {
          expect(state.isOpen).toBe(false);
          done();
        }
      });

      service.actions.open({ step: 1 });
      service.actions.open({ step: 2 });
      service.actions.close();
    });
  });

  describe('callbacks', () => {
    it('should invoke onOpen callback', () => {
      const onOpen = vi.fn();
      service.initialize({ onOpen });

      service.actions.open({ title: 'Test' });

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith({ title: 'Test' });
    });

    it('should invoke onClose callback', () => {
      const onClose = vi.fn();
      service.initialize({ onClose });

      service.actions.open({ title: 'Test' });
      service.actions.close();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize();

      service.actions.open({ title: 'Test' });
      expect(service.getState().isOpen).toBe(true);

      // Destroy should trigger cleanup
      service.ngOnDestroy();

      // No errors should occur
      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should complete Observable on destroy', (done) => {
      service.initialize();

      service.getState$().subscribe({
        next: () => {},
        complete: () => {
          done();
        },
      });

      service.ngOnDestroy();
    });

    it('should not emit after destroy', () => {
      service.initialize();

      const emissions: any[] = [];
      service.getState$().subscribe((state) => {
        emissions.push(state);
      });

      service.actions.open({ title: 'Test' });
      const emissionsBeforeDestroy = emissions.length;

      service.ngOnDestroy();

      // After destroy, behavior is null so accessing actions will throw
      // This is expected behavior - service should not be used after destroy
      expect(() => service.actions).toThrow(
        'DialogBehaviorService not initialized. Call initialize() first.'
      );

      expect(emissions.length).toBe(emissionsBeforeDestroy);
    });
  });

  describe('re-initialization', () => {
    it('should allow re-initialization after cleanup', () => {
      service.initialize({ id: 'first' });
      expect(service.getState().id).toBe('first');

      service.initialize({ id: 'second' });
      expect(service.getState().id).toBe('second');
    });

    it('should clean up previous behavior when re-initializing', () => {
      service.initialize();
      service.actions.open({ title: 'First' });
      expect(service.getState().isOpen).toBe(true);

      service.initialize();
      expect(service.getState().isOpen).toBe(false);
    });
  });

  describe('synchronous state access', () => {
    it('should provide synchronous access to current state', () => {
      service.initialize();

      service.actions.open({ title: 'Test' });
      const state = service.getState();

      expect(state.isOpen).toBe(true);
      expect(state.content).toEqual({ title: 'Test' });
    });

    it('should return updated state immediately after action', () => {
      service.initialize();

      expect(service.getState().isOpen).toBe(false);

      service.actions.open({ title: 'Test' });
      expect(service.getState().isOpen).toBe(true);

      service.actions.close();
      expect(service.getState().isOpen).toBe(false);
    });
  });
});
