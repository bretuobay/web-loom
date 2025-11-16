import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useListSelection } from '../index';

describe('useListSelection', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection();
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.selection.selectedIds.value).toEqual([]);
      expect(vm.selection.lastSelectedId.value).toBeNull();
      expect(vm.selection.mode.value).toBe('single');
      expect(vm.selection.items.value).toEqual([]);
    });

    it('should initialize with provided options', () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
            mode: 'multi',
          });
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.selection.items.value).toEqual(['item-1', 'item-2', 'item-3']);
      expect(vm.selection.mode.value).toBe('multi');
    });
  });

  describe('reactivity', () => {
    it('should update when selecting an item', async () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
            mode: 'single',
          });
          return { selection };
        },
        template: '<div>{{ selection.selectedIds.value.length }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.selection.selectedIds.value).toEqual([]);

      vm.selection.actions.select('item-1');
      await nextTick();

      expect(vm.selection.selectedIds.value).toEqual(['item-1']);
      expect(wrapper.text()).toBe('1');
    });

    it('should update when deselecting an item', async () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
            mode: 'multi',
          });
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.selection.actions.select('item-1');
      await nextTick();
      expect(vm.selection.selectedIds.value).toEqual(['item-1']);

      vm.selection.actions.deselect('item-1');
      await nextTick();
      expect(vm.selection.selectedIds.value).toEqual([]);
    });

    it('should update when toggling selection', async () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
            mode: 'multi',
          });
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.selection.actions.toggleSelection('item-1');
      await nextTick();
      expect(vm.selection.selectedIds.value).toEqual(['item-1']);

      vm.selection.actions.toggleSelection('item-1');
      await nextTick();
      expect(vm.selection.selectedIds.value).toEqual([]);
    });

    it('should update when clearing selection', async () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
            mode: 'multi',
          });
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.selection.actions.select('item-1');
      vm.selection.actions.select('item-2');
      await nextTick();
      expect(vm.selection.selectedIds.value).toEqual(['item-1', 'item-2']);

      vm.selection.actions.clearSelection();
      await nextTick();
      expect(vm.selection.selectedIds.value).toEqual([]);
    });

    it('should update when selecting all items', async () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
            mode: 'multi',
          });
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.selection.actions.selectAll();
      await nextTick();

      expect(vm.selection.selectedIds.value).toEqual(['item-1', 'item-2', 'item-3']);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', () => {
      const TestComponent = defineComponent({
        setup() {
          const selection = useListSelection({
            items: ['item-1', 'item-2', 'item-3'],
          });
          return { selection };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      wrapper.unmount();

      expect(() => wrapper.unmount()).not.toThrow();
    });
  });
});
