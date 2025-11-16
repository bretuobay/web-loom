import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useDialogBehavior } from '../index';

describe('useDialogBehavior', () => {
  describe('initial state', () => {
    it('should initialize with closed state', () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.dialog.isOpen.value).toBe(false);
      expect(vm.dialog.content.value).toBeNull();
      expect(vm.dialog.id.value).toBeNull();
    });

    it('should initialize with provided id', () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior({ id: 'test-dialog' });
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.dialog.id.value).toBe('test-dialog');
      expect(vm.dialog.isOpen.value).toBe(false);
    });
  });

  describe('reactivity with Vue reactive system', () => {
    it('should update component when opening dialog', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div>{{ dialog.isOpen.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.dialog.isOpen.value).toBe(false);

      vm.dialog.actions.open({ title: 'Test Dialog' });
      await nextTick();

      expect(vm.dialog.isOpen.value).toBe(true);
      expect(vm.dialog.content.value).toEqual({ title: 'Test Dialog' });
      expect(wrapper.text()).toBe('true');
    });

    it('should update component when closing dialog', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div>{{ dialog.isOpen.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dialog.actions.open({ title: 'Test' });
      await nextTick();
      expect(vm.dialog.isOpen.value).toBe(true);

      vm.dialog.actions.close();
      await nextTick();

      expect(vm.dialog.isOpen.value).toBe(false);
      expect(vm.dialog.content.value).toBeNull();
      expect(wrapper.text()).toBe('false');
    });

    it('should update component when toggling dialog', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div>{{ dialog.isOpen.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dialog.actions.toggle({ title: 'Toggle Test' });
      await nextTick();
      expect(vm.dialog.isOpen.value).toBe(true);

      vm.dialog.actions.toggle();
      await nextTick();
      expect(vm.dialog.isOpen.value).toBe(false);
    });

    it('should handle multiple state updates', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dialog.actions.open({ step: 1 });
      await nextTick();
      expect(vm.dialog.content.value).toEqual({ step: 1 });

      vm.dialog.actions.open({ step: 2 });
      await nextTick();
      expect(vm.dialog.content.value).toEqual({ step: 2 });

      vm.dialog.actions.close();
      await nextTick();
      expect(vm.dialog.isOpen.value).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should invoke onOpen callback', async () => {
      const onOpen = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior({ onOpen });
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dialog.actions.open({ title: 'Test' });
      await nextTick();

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith({ title: 'Test' });
    });

    it('should invoke onClose callback', async () => {
      const onClose = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior({ onClose });
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dialog.actions.open({ title: 'Test' });
      await nextTick();
      vm.dialog.actions.close();
      await nextTick();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dialog.actions.open({ title: 'Test' });
      await nextTick();
      expect(vm.dialog.isOpen.value).toBe(true);

      // Unmount should trigger cleanup
      wrapper.unmount();

      // No errors should occur
      expect(() => wrapper.unmount()).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      const actions = vm.dialog.actions;
      wrapper.unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.open({ title: 'Test' });
      }).not.toThrow();
    });
  });

  describe('computed properties', () => {
    it('should provide computed properties for all state values', () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      // All state properties should be computed refs
      expect(vm.dialog.isOpen.value).toBeDefined();
      expect(vm.dialog.content.value).toBeDefined();
      expect(vm.dialog.id.value).toBeDefined();
    });

    it('should maintain reactivity through computed properties', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dialog = useDialogBehavior();
          return { dialog };
        },
        template: '<div>{{ dialog.isOpen.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('false');

      vm.dialog.actions.open({ title: 'Test' });
      await nextTick();

      expect(wrapper.text()).toBe('true');
    });
  });
});
