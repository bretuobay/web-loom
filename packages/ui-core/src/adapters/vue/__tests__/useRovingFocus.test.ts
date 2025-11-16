import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useRovingFocus } from '../index';

describe('useRovingFocus', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus();
          return { focus };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.focus.currentIndex.value).toBe(0);
      expect(vm.focus.items.value).toEqual([]);
      expect(vm.focus.orientation.value).toBe('vertical');
      expect(vm.focus.wrap.value).toBe(true);
    });

    it('should initialize with provided options', () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
            orientation: 'vertical',
            wrap: false,
          });
          return { focus };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.focus.items.value).toEqual(['item-1', 'item-2', 'item-3']);
      expect(vm.focus.orientation.value).toBe('vertical');
      expect(vm.focus.wrap.value).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('should update when moving to next item', async () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
          });
          return { focus };
        },
        template: '<div>{{ focus.currentIndex.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.focus.currentIndex.value).toBe(0);

      vm.focus.actions.moveNext();
      await nextTick();

      expect(vm.focus.currentIndex.value).toBe(1);
      expect(wrapper.text()).toBe('1');
    });

    it('should update when moving to previous item', async () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
            initialIndex: 2,
          });
          return { focus };
        },
        template: '<div>{{ focus.currentIndex.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.focus.currentIndex.value).toBe(2);

      vm.focus.actions.movePrevious();
      await nextTick();

      expect(vm.focus.currentIndex.value).toBe(1);
    });

    it('should update when moving to first item', async () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
            initialIndex: 2,
          });
          return { focus };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.focus.actions.moveFirst();
      await nextTick();

      expect(vm.focus.currentIndex.value).toBe(0);
    });

    it('should update when moving to last item', async () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
          });
          return { focus };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.focus.actions.moveLast();
      await nextTick();

      expect(vm.focus.currentIndex.value).toBe(2);
    });

    it('should update when moving to specific index', async () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
          });
          return { focus };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.focus.actions.moveTo(1);
      await nextTick();

      expect(vm.focus.currentIndex.value).toBe(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const TestComponent = defineComponent({
        setup() {
          const focus = useRovingFocus({
            items: ['item-1', 'item-2', 'item-3'],
          });
          return { focus };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      wrapper.unmount();

      expect(() => wrapper.unmount()).not.toThrow();
    });
  });
});
