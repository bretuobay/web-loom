import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { BaseModel } from '@web-loom/mvvm-core';
import { ActiveAwareViewModel } from './ActiveAwareViewModel';
import { isActiveAware } from '../lifecycle/IActiveAware';

class TestModel extends BaseModel<{ value: string }, any> {
  constructor() {
    super({ initialData: { value: 'test' } });
  }
}

class TestActiveViewModel extends ActiveAwareViewModel<TestModel> {
  public activeChangeCalls: Array<{ isActive: boolean; wasActive: boolean }> = [];

  protected override onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
    this.activeChangeCalls.push({ isActive, wasActive });
  }
}

describe('ActiveAwareViewModel', () => {
  let model: TestModel;
  let vm: TestActiveViewModel;

  beforeEach(() => {
    model = new TestModel();
    vm = new TestActiveViewModel(model);
  });

  describe('initial state', () => {
    it('should start as inactive', () => {
      expect(vm.isActive).toBe(false);
    });

    it('should emit false initially on isActive$', async () => {
      const value = await firstValueFrom(vm.isActive$);
      expect(value).toBe(false);
    });
  });

  describe('isActive setter', () => {
    it('should update isActive value', () => {
      vm.isActive = true;
      expect(vm.isActive).toBe(true);
    });

    it('should emit on isActive$', async () => {
      const valuesPromise = firstValueFrom(vm.isActive$.pipe(take(2), toArray()));

      vm.isActive = true;

      const values = await valuesPromise;
      expect(values).toEqual([false, true]);
    });

    it('should not emit duplicate values', async () => {
      const emissions: boolean[] = [];
      vm.isActive$.subscribe((v) => emissions.push(v));

      vm.isActive = true;
      vm.isActive = true; // Same value

      // Wait a tick for any potential emissions
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(emissions).toEqual([false, true]);
    });

    it('should call onIsActiveChanged', () => {
      vm.isActive = true;

      expect(vm.activeChangeCalls).toEqual([{ isActive: true, wasActive: false }]);
    });

    it('should not call onIsActiveChanged for same value', () => {
      vm.isActive = false; // Same as initial

      expect(vm.activeChangeCalls).toEqual([]);
    });

    it('should call onIsActiveChanged with correct previous value', () => {
      vm.isActive = true;
      vm.isActive = false;

      expect(vm.activeChangeCalls).toEqual([
        { isActive: true, wasActive: false },
        { isActive: false, wasActive: true },
      ]);
    });
  });

  describe('activate/deactivate', () => {
    it('activate() should set isActive to true', () => {
      vm.activate();
      expect(vm.isActive).toBe(true);
    });

    it('deactivate() should set isActive to false', () => {
      vm.activate();
      vm.deactivate();
      expect(vm.isActive).toBe(false);
    });

    it('activate() should trigger onIsActiveChanged', () => {
      vm.activate();
      expect(vm.activeChangeCalls).toEqual([{ isActive: true, wasActive: false }]);
    });

    it('deactivate() should trigger onIsActiveChanged', () => {
      vm.activate();
      vm.activeChangeCalls = []; // Reset
      vm.deactivate();
      expect(vm.activeChangeCalls).toEqual([{ isActive: false, wasActive: true }]);
    });
  });

  describe('dispose', () => {
    it('should complete isActive$', async () => {
      const completeSpy = vi.fn();
      vm.isActive$.subscribe({ complete: completeSpy });

      vm.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not emit after dispose', () => {
      const emissions: boolean[] = [];
      vm.isActive$.subscribe((v) => emissions.push(v));

      vm.dispose();
      vm.isActive = true; // Should not emit

      expect(emissions).toEqual([false]); // Only initial value
    });
  });

  describe('isActiveAware type guard', () => {
    it('should return true for ActiveAwareViewModel', () => {
      expect(isActiveAware(vm)).toBe(true);
    });

    it('should return false for plain object', () => {
      expect(isActiveAware({})).toBe(false);
    });

    it('should return false for null', () => {
      expect(isActiveAware(null)).toBe(false);
    });

    it('should return false for object without isActive property', () => {
      expect(isActiveAware({ isActive$: {} })).toBe(false);
    });

    it('should return false for object without isActive$ property', () => {
      expect(isActiveAware({ isActive: true })).toBe(false);
    });

    it('should return false for object with non-observable isActive$', () => {
      expect(isActiveAware({ isActive: true, isActive$: {} })).toBe(false);
    });
  });

  describe('integration with BaseViewModel', () => {
    it('should have access to data$', async () => {
      const data = await firstValueFrom(vm.data$);
      expect(data).toEqual({ value: 'test' });
    });

    it('should have access to isLoading$', async () => {
      const isLoading = await firstValueFrom(vm.isLoading$);
      expect(isLoading).toBe(false);
    });

    it('should have access to error$', async () => {
      const error = await firstValueFrom(vm.error$);
      expect(error).toBeNull();
    });

    it('should dispose model subscriptions', () => {
      const disposeSpy = vi.spyOn(model, 'dispose');
      vm.dispose();
      // BaseViewModel doesn't dispose the model, but completes its own subscriptions
      expect(disposeSpy).not.toHaveBeenCalled();
    });
  });

  describe('multiple state changes', () => {
    it('should handle rapid state changes correctly', async () => {
      const emissions: boolean[] = [];
      vm.isActive$.subscribe((v) => emissions.push(v));

      vm.isActive = true;
      vm.isActive = false;
      vm.isActive = true;
      vm.isActive = false;

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(emissions).toEqual([false, true, false, true, false]);
    });

    it('should call onIsActiveChanged for each change', () => {
      vm.isActive = true;
      vm.isActive = false;
      vm.isActive = true;

      expect(vm.activeChangeCalls).toEqual([
        { isActive: true, wasActive: false },
        { isActive: false, wasActive: true },
        { isActive: true, wasActive: false },
      ]);
    });
  });
});
