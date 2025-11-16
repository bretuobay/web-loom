import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useDisclosureBehavior } from '../index';

describe('useDisclosureBehavior', () => {
  describe('initial state', () => {
    it('should initialize with collapsed state', () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior();
          return { disclosure };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.disclosure.isExpanded.value).toBe(false);
      expect(vm.disclosure.id.value).toBeNull();
    });

    it('should initialize with provided id', () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior({ id: 'section-1' });
          return { disclosure };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.disclosure.id.value).toBe('section-1');
      expect(vm.disclosure.isExpanded.value).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('should update when expanding', async () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior();
          return { disclosure };
        },
        template: '<div>{{ disclosure.isExpanded.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.disclosure.isExpanded.value).toBe(false);

      vm.disclosure.actions.expand();
      await nextTick();

      expect(vm.disclosure.isExpanded.value).toBe(true);
      expect(wrapper.text()).toBe('true');
    });

    it('should update when collapsing', async () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior();
          return { disclosure };
        },
        template: '<div>{{ disclosure.isExpanded.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.disclosure.actions.expand();
      await nextTick();
      expect(vm.disclosure.isExpanded.value).toBe(true);

      vm.disclosure.actions.collapse();
      await nextTick();

      expect(vm.disclosure.isExpanded.value).toBe(false);
      expect(wrapper.text()).toBe('false');
    });

    it('should update when toggling', async () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior();
          return { disclosure };
        },
        template: '<div>{{ disclosure.isExpanded.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.disclosure.actions.toggle();
      await nextTick();
      expect(vm.disclosure.isExpanded.value).toBe(true);

      vm.disclosure.actions.toggle();
      await nextTick();
      expect(vm.disclosure.isExpanded.value).toBe(false);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior();
          return { disclosure };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      wrapper.unmount();

      expect(() => wrapper.unmount()).not.toThrow();
    });
  });

  describe('computed properties', () => {
    it('should provide computed properties for all state values', () => {
      const TestComponent = defineComponent({
        setup() {
          const disclosure = useDisclosureBehavior();
          return { disclosure };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.disclosure.isExpanded.value).toBeDefined();
      expect(vm.disclosure.id.value).toBeDefined();
    });
  });
});
