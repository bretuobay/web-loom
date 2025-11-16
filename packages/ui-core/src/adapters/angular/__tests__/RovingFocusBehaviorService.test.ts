import { describe, it, expect, beforeEach } from 'vitest';
import { RovingFocusBehaviorService } from '../index';
import { firstValueFrom } from 'rxjs';

describe('RovingFocusBehaviorService', () => {
  let service: RovingFocusBehaviorService;

  beforeEach(() => {
    service = new RovingFocusBehaviorService();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      service.initialize();

      const state = service.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.items).toEqual([]);
      expect(state.orientation).toBe('vertical');
      expect(state.wrap).toBe(true);
    });

    it('should initialize with provided items', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        orientation: 'horizontal',
      });

      const state = service.getState();
      expect(state.items).toEqual(['item-1', 'item-2', 'item-3']);
      expect(state.orientation).toBe('horizontal');
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize({ items: ['item-1', 'item-2'] });

      const state = await firstValueFrom(service.getState$());
      expect(state.currentIndex).toBe(0);
      expect(state.items).toEqual(['item-1', 'item-2']);
    });

    it('should emit state updates when moving focus', (done) => {
      service.initialize({ items: ['item-1', 'item-2', 'item-3'] });

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.currentIndex).toBe(1);
          done();
        }
      });

      service.actions.moveNext();
    });
  });

  describe('focus navigation', () => {
    it('should move focus to next item', () => {
      service.initialize({ items: ['item-1', 'item-2', 'item-3'] });

      service.actions.moveNext();
      expect(service.getState().currentIndex).toBe(1);

      service.actions.moveNext();
      expect(service.getState().currentIndex).toBe(2);
    });

    it('should move focus to previous item', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        initialIndex: 2,
      });

      service.actions.movePrevious();
      expect(service.getState().currentIndex).toBe(1);

      service.actions.movePrevious();
      expect(service.getState().currentIndex).toBe(0);
    });

    it('should wrap focus from last to first item', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        initialIndex: 2,
        wrap: true,
      });

      service.actions.moveNext();
      expect(service.getState().currentIndex).toBe(0);
    });

    it('should wrap focus from first to last item', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        wrap: true,
      });

      service.actions.movePrevious();
      expect(service.getState().currentIndex).toBe(2);
    });

    it('should move focus to first item', () => {
      service.initialize({
        items: ['item-1', 'item-2', 'item-3'],
        initialIndex: 2,
      });

      service.actions.moveFirst();
      expect(service.getState().currentIndex).toBe(0);
    });

    it('should move focus to last item', () => {
      service.initialize({ items: ['item-1', 'item-2', 'item-3'] });

      service.actions.moveLast();
      expect(service.getState().currentIndex).toBe(2);
    });

    it('should move focus to specific index', () => {
      service.initialize({ items: ['item-1', 'item-2', 'item-3'] });

      service.actions.moveTo(1);
      expect(service.getState().currentIndex).toBe(1);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize({ items: ['item-1', 'item-2'] });

      service.ngOnDestroy();

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
  });
});
