import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisclosureBehaviorService } from '../index';
import { firstValueFrom, skip, take } from 'rxjs';

describe('DisclosureBehaviorService', () => {
  let service: DisclosureBehaviorService;

  beforeEach(() => {
    service = new DisclosureBehaviorService();
  });

  describe('initialization', () => {
    it('should initialize with collapsed state', () => {
      service.initialize();

      const state = service.getState();
      expect(state.isExpanded).toBe(false);
      expect(state.id).toBeNull();
    });

    it('should initialize with provided id and expanded state', () => {
      service.initialize({
        id: 'section-1',
        initialExpanded: true,
      });

      const state = service.getState();
      expect(state.id).toBe('section-1');
      expect(state.isExpanded).toBe(true);
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize();

      const state = await firstValueFrom(service.getState$());
      expect(state.isExpanded).toBe(false);
    });

    it('should emit state updates when expanding', async () => {
      service.initialize();

      const statePromise = firstValueFrom(service.getState$().pipe(skip(1)));
      service.actions.expand();

      const state = await statePromise;
      expect(state.isExpanded).toBe(true);
    });

    it('should emit state updates when collapsing', async () => {
      service.initialize({ initialExpanded: true });

      const statePromise = firstValueFrom(service.getState$().pipe(skip(1)));
      service.actions.collapse();

      const state = await statePromise;
      expect(state.isExpanded).toBe(false);
    });
  });

  describe('disclosure actions', () => {
    it('should expand disclosure', () => {
      service.initialize();

      service.actions.expand();
      expect(service.getState().isExpanded).toBe(true);
    });

    it('should collapse disclosure', () => {
      service.initialize({ initialExpanded: true });

      service.actions.collapse();
      expect(service.getState().isExpanded).toBe(false);
    });

    it('should toggle disclosure', () => {
      service.initialize();

      service.actions.toggle();
      expect(service.getState().isExpanded).toBe(true);

      service.actions.toggle();
      expect(service.getState().isExpanded).toBe(false);
    });

    it('should not emit when expanding already expanded disclosure', async () => {
      service.initialize({ initialExpanded: true });

      let emissionCount = 0;
      service.getState$().subscribe(() => {
        emissionCount++;
      });

      service.actions.expand();

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(emissionCount).toBe(1); // Only initial emission
    });

    it('should not emit when collapsing already collapsed disclosure', async () => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe(() => {
        emissionCount++;
      });

      service.actions.collapse();

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(emissionCount).toBe(1); // Only initial emission
    });
  });

  describe('callbacks', () => {
    it('should invoke onExpand callback', () => {
      const onExpand = vi.fn();
      service.initialize({ onExpand });

      service.actions.expand();

      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('should invoke onCollapse callback', () => {
      const onCollapse = vi.fn();
      service.initialize({ initialExpanded: true, onCollapse });

      service.actions.collapse();

      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('should invoke callbacks when toggling', () => {
      const onExpand = vi.fn();
      const onCollapse = vi.fn();
      service.initialize({ onExpand, onCollapse });

      service.actions.toggle();
      expect(onExpand).toHaveBeenCalledTimes(1);

      service.actions.toggle();
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize();

      service.ngOnDestroy();

      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should complete Observable on destroy', async () => {
      service.initialize();

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
});
