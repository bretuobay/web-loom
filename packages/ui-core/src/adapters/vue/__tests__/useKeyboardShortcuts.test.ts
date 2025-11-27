import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  describe('initial state', () => {
    it('should initialize with empty shortcuts', () => {
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.shortcuts.shortcuts.value.size).toBe(0);
      expect(vm.shortcuts.activeShortcuts.value).toEqual([]);
      expect(vm.shortcuts.enabled.value).toBe(true);
      expect(vm.shortcuts.scope.value).toBe('global');
    });

    it('should initialize with provided scope', () => {
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts({ scope: 'scoped' });
          return { shortcuts };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.shortcuts.scope.value).toBe('scoped');
    });
  });

  describe('reactivity with Vue reactive system', () => {
    it('should update component when registering shortcut', async () => {
      const handler = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div>{{ shortcuts.activeShortcuts.value.length }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('0');

      vm.shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
        description: 'Test shortcut',
      });
      await nextTick();

      expect(vm.shortcuts.activeShortcuts.value.length).toBe(1);
      expect(wrapper.text()).toBe('1');
    });

    it('should update component when unregistering shortcut', async () => {
      const handler = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div>{{ shortcuts.activeShortcuts.value.length }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });
      await nextTick();
      expect(wrapper.text()).toBe('1');

      vm.shortcuts.actions.unregisterShortcut('Ctrl+K');
      await nextTick();

      expect(vm.shortcuts.activeShortcuts.value.length).toBe(0);
      expect(wrapper.text()).toBe('0');
    });

    it('should update component when changing scope', async () => {
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div>{{ shortcuts.scope.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('global');

      vm.shortcuts.actions.setScope('scoped');
      await nextTick();

      expect(vm.shortcuts.scope.value).toBe('scoped');
      expect(wrapper.text()).toBe('scoped');
    });

    it('should update component when enabling/disabling', async () => {
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div>{{ shortcuts.enabled.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('true');

      vm.shortcuts.actions.disable();
      await nextTick();
      expect(wrapper.text()).toBe('false');

      vm.shortcuts.actions.enable();
      await nextTick();
      expect(wrapper.text()).toBe('true');
    });
  });

  describe('callbacks', () => {
    it('should invoke onShortcutExecuted callback', async () => {
      const onShortcutExecuted = vi.fn();
      const handler = vi.fn();
      
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts({ onShortcutExecuted });
          return { shortcuts };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });
      await nextTick();

      // Simulate keyboard event
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
      });
      document.dispatchEvent(event);
      await nextTick();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(onShortcutExecuted).toHaveBeenCalledWith('Ctrl+K');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', async () => {
      const handler = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });
      await nextTick();

      // Unmount should trigger cleanup
      wrapper.unmount();

      // No errors should occur
      expect(() => wrapper.unmount()).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const handler = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      const actions = vm.shortcuts.actions;
      wrapper.unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.registerShortcut({ key: 'Ctrl+K', handler });
      }).not.toThrow();
    });
  });

  describe('computed properties', () => {
    it('should provide computed properties for all state values', () => {
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      // All state properties should be computed refs
      expect(vm.shortcuts.shortcuts.value).toBeDefined();
      expect(vm.shortcuts.scope.value).toBeDefined();
      expect(vm.shortcuts.activeShortcuts.value).toBeDefined();
      expect(vm.shortcuts.enabled.value).toBeDefined();
    });

    it('should maintain reactivity through computed properties', async () => {
      const handler = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const shortcuts = useKeyboardShortcuts();
          return { shortcuts };
        },
        template: '<div>{{ shortcuts.activeShortcuts.value.length }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('0');

      vm.shortcuts.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });
      await nextTick();

      expect(wrapper.text()).toBe('1');
    });
  });
});
