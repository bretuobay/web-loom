import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useUndoRedoStack } from '../useUndoRedoStack';

interface TestState {
  value: number;
  text: string;
}

describe('useUndoRedoStack', () => {
  describe('initial state', () => {
    it('should initialize with provided initial state', () => {
      const initialState: TestState = { value: 0, text: 'initial' };
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({ initialState });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.undoRedo.present.value).toEqual(initialState);
      expect(vm.undoRedo.past.value).toEqual([]);
      expect(vm.undoRedo.future.value).toEqual([]);
      expect(vm.undoRedo.canUndo.value).toBe(false);
      expect(vm.undoRedo.canRedo.value).toBe(false);
    });

    it('should initialize with provided maxLength', () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
            maxLength: 10,
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.undoRedo.maxLength.value).toBe(10);
    });
  });

  describe('reactivity with Vue reactive system', () => {
    it('should update component when pushing state', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div>{{ undoRedo.present.value.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('0');

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();

      expect(vm.undoRedo.present.value).toEqual({ value: 1, text: 'first' });
      expect(vm.undoRedo.past.value.length).toBe(1);
      expect(vm.undoRedo.canUndo.value).toBe(true);
      expect(wrapper.text()).toBe('1');
    });

    it('should update component when undoing', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div>{{ undoRedo.present.value.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();
      expect(wrapper.text()).toBe('1');

      vm.undoRedo.actions.undo();
      await nextTick();

      expect(vm.undoRedo.present.value).toEqual({ value: 0, text: 'initial' });
      expect(vm.undoRedo.canRedo.value).toBe(true);
      expect(wrapper.text()).toBe('0');
    });

    it('should update component when redoing', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div>{{ undoRedo.present.value.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();
      vm.undoRedo.actions.undo();
      await nextTick();
      expect(wrapper.text()).toBe('0');

      vm.undoRedo.actions.redo();
      await nextTick();

      expect(vm.undoRedo.present.value).toEqual({ value: 1, text: 'first' });
      expect(wrapper.text()).toBe('1');
    });

    it('should handle multiple state updates', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();
      vm.undoRedo.actions.pushState({ value: 2, text: 'second' });
      await nextTick();
      vm.undoRedo.actions.pushState({ value: 3, text: 'third' });
      await nextTick();

      expect(vm.undoRedo.present.value.value).toBe(3);
      expect(vm.undoRedo.past.value.length).toBe(3);

      vm.undoRedo.actions.undo();
      await nextTick();
      expect(vm.undoRedo.present.value.value).toBe(2);

      vm.undoRedo.actions.undo();
      await nextTick();
      expect(vm.undoRedo.present.value.value).toBe(1);
    });
  });

  describe('callbacks', () => {
    it('should invoke onStateChange callback', async () => {
      const onStateChange = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
            onStateChange,
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();

      expect(onStateChange).toHaveBeenCalledWith({ value: 1, text: 'first' });
    });

    it('should invoke onStateChange on undo', async () => {
      const onStateChange = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
            onStateChange,
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();
      onStateChange.mockClear();

      vm.undoRedo.actions.undo();
      await nextTick();

      expect(onStateChange).toHaveBeenCalledWith({ value: 0, text: 'initial' });
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.undoRedo.actions.pushState({ value: 1, text: 'first' });
      await nextTick();

      // Unmount should trigger cleanup
      wrapper.unmount();

      // No errors should occur
      expect(() => wrapper.unmount()).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      const actions = vm.undoRedo.actions;
      wrapper.unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.pushState({ value: 1, text: 'first' });
      }).not.toThrow();
    });
  });

  describe('computed properties', () => {
    it('should provide computed properties for all state values', () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      // All state properties should be computed refs
      expect(vm.undoRedo.past.value).toBeDefined();
      expect(vm.undoRedo.present.value).toBeDefined();
      expect(vm.undoRedo.future.value).toBeDefined();
      expect(vm.undoRedo.canUndo.value).toBeDefined();
      expect(vm.undoRedo.canRedo.value).toBeDefined();
      expect(vm.undoRedo.maxLength.value).toBeDefined();
    });

    it('should maintain reactivity through computed properties', async () => {
      const TestComponent = defineComponent({
        setup() {
          const undoRedo = useUndoRedoStack<TestState>({
            initialState: { value: 0, text: 'initial' },
          });
          return { undoRedo };
        },
        template: '<div>{{ undoRedo.present.value.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('0');

      vm.undoRedo.actions.pushState({ value: 42, text: 'answer' });
      await nextTick();

      expect(wrapper.text()).toBe('42');
    });
  });
});
