import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisclosureBehaviorService } from '../index';
import { firstValueFrom } from 'rxjs';

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

    it('should emit state updates when expanding', (done) => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.isExpanded).toBe(true);
          done();
        }
      });

      service.actions.expand();
    });

    it('should emit state updates when collapsing', (done) => {
      service.initialize({ initialExpanded: true });

      let emissionCount = 0;
      service.getState$().subscribe((state) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.isExpanded).toBe(false);
          done();
        }
      });

      service.actions.collapse();
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

    it('should not emit when expanding already expanded disclosure', (done) => {
      service.initialize({ initialExpanded: true });

      let emissionCount = 0;
      service.getState$().subscribe(() => {
        emissionCount++;
      });

      service.actions.expand();

      setTimeout(() => {
        expect(emissionCount).toBe(1); // Only initial emission
        done();
      }, 50);
    });

    it('should not emit when collapsing already collapsed disclosure', (done) => {
      service.initialize();

      let emissionCount = 0;
      service.getState$().subscribe(() => {
        emissionCount++;
      });

      service.actions.collapse();

      setTimeout(() => {
        expect(emissionCount).toBe(1); // Only initial emission
        done();
      }, 50);
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
