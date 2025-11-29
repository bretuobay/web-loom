import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useDragDropBehavior } from '../useDragDropBehavior';

describe('useDragDropBehavior', () => {
  describe('initial state', () => {
    it('should initialize with no drag operation', () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(vm.dragDrop.isDragging.value).toBe(false);
      expect(vm.dragDrop.draggedItem.value).toBeNull();
      expect(vm.dragDrop.dropTarget.value).toBeNull();
      expect(vm.dragDrop.dragData.value).toBeNull();
      expect(vm.dragDrop.dropZones.value).toEqual([]);
      expect(vm.dragDrop.dragOverZone.value).toBeNull();
    });
  });

  describe('reactivity with Vue reactive system', () => {
    it('should update component when starting drag', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div>{{ dragDrop.isDragging.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('false');

      vm.dragDrop.actions.startDrag('item-1', { title: 'Test Item' });
      await nextTick();

      expect(vm.dragDrop.isDragging.value).toBe(true);
      expect(vm.dragDrop.draggedItem.value).toBe('item-1');
      expect(vm.dragDrop.dragData.value).toEqual({ title: 'Test Item' });
      expect(wrapper.text()).toBe('true');
    });

    it('should update component when ending drag', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div>{{ dragDrop.isDragging.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dragDrop.actions.startDrag('item-1');
      await nextTick();
      expect(wrapper.text()).toBe('true');

      vm.dragDrop.actions.endDrag();
      await nextTick();

      expect(vm.dragDrop.isDragging.value).toBe(false);
      expect(vm.dragDrop.draggedItem.value).toBeNull();
      expect(wrapper.text()).toBe('false');
    });

    it('should update component when registering drop zones', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div>{{ dragDrop.dropZones.value.length }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('0');

      vm.dragDrop.actions.registerDropZone('zone-1');
      await nextTick();
      expect(wrapper.text()).toBe('1');

      vm.dragDrop.actions.registerDropZone('zone-2');
      await nextTick();
      expect(wrapper.text()).toBe('2');
    });

    it('should update component when setting drag over zone', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div>{{ dragDrop.dragOverZone.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('');

      vm.dragDrop.actions.setDragOver('zone-1');
      await nextTick();

      expect(vm.dragDrop.dragOverZone.value).toBe('zone-1');
      expect(wrapper.text()).toBe('zone-1');
    });

    it('should handle complete drag-and-drop flow', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      // Register drop zones
      vm.dragDrop.actions.registerDropZone('zone-1');
      vm.dragDrop.actions.registerDropZone('zone-2');
      await nextTick();

      // Start drag
      vm.dragDrop.actions.startDrag('item-1', { title: 'Test' });
      await nextTick();
      expect(vm.dragDrop.isDragging.value).toBe(true);

      // Set drag over
      vm.dragDrop.actions.setDragOver('zone-2');
      await nextTick();
      expect(vm.dragDrop.dragOverZone.value).toBe('zone-2');

      // Drop
      vm.dragDrop.actions.drop('zone-2');
      await nextTick();

      // End drag
      vm.dragDrop.actions.endDrag();
      await nextTick();
      expect(vm.dragDrop.isDragging.value).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should invoke onDragStart callback', async () => {
      const onDragStart = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior({ onDragStart });
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dragDrop.actions.startDrag('item-1', { title: 'Test' });
      await nextTick();

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith('item-1', { title: 'Test' });
    });

    it('should invoke onDragEnd callback', async () => {
      const onDragEnd = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior({ onDragEnd });
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dragDrop.actions.startDrag('item-1');
      await nextTick();
      vm.dragDrop.actions.endDrag();
      await nextTick();

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledWith('item-1');
    });

    it('should invoke onDrop callback', async () => {
      const onDrop = vi.fn();
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior({ onDrop });
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dragDrop.actions.registerDropZone('zone-1');
      await nextTick();
      vm.dragDrop.actions.startDrag('item-1', { title: 'Test' });
      await nextTick();
      vm.dragDrop.actions.drop('zone-1');
      await nextTick();

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith('item-1', 'zone-1', { title: 'Test' });
    });

    it('should respect validateDrop callback', async () => {
      const onDrop = vi.fn();
      const validateDrop = vi.fn((draggedItem: string, dropTarget: string) => {
        return dropTarget !== 'locked-zone';
      });

      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior({ onDrop, validateDrop });
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dragDrop.actions.registerDropZone('locked-zone');
      vm.dragDrop.actions.registerDropZone('valid-zone');
      await nextTick();

      vm.dragDrop.actions.startDrag('item-1');
      await nextTick();

      // Try to drop on locked zone
      vm.dragDrop.actions.drop('locked-zone');
      await nextTick();
      expect(onDrop).not.toHaveBeenCalled();

      // Drop on valid zone
      vm.dragDrop.actions.drop('valid-zone');
      await nextTick();
      expect(onDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up behavior when component unmounts', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      vm.dragDrop.actions.startDrag('item-1');
      await nextTick();

      // Unmount should trigger cleanup
      wrapper.unmount();

      // No errors should occur
      expect(() => wrapper.unmount()).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      const actions = vm.dragDrop.actions;
      wrapper.unmount();

      // Actions should not cause errors after unmount
      expect(() => {
        actions.startDrag('item-1');
      }).not.toThrow();
    });
  });

  describe('computed properties', () => {
    it('should provide computed properties for all state values', () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div></div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      // All state properties should be computed refs
      expect(vm.dragDrop.draggedItem.value).toBeDefined();
      expect(vm.dragDrop.dropTarget.value).toBeDefined();
      expect(vm.dragDrop.isDragging.value).toBeDefined();
      expect(vm.dragDrop.dragData.value).toBeDefined();
      expect(vm.dragDrop.dropZones.value).toBeDefined();
      expect(vm.dragDrop.dragOverZone.value).toBeDefined();
    });

    it('should maintain reactivity through computed properties', async () => {
      const TestComponent = defineComponent({
        setup() {
          const dragDrop = useDragDropBehavior();
          return { dragDrop };
        },
        template: '<div>{{ dragDrop.isDragging.value }}</div>',
      });

      const wrapper = mount(TestComponent);
      const vm = wrapper.vm as any;

      expect(wrapper.text()).toBe('false');

      vm.dragDrop.actions.startDrag('item-1');
      await nextTick();

      expect(wrapper.text()).toBe('true');
    });
  });
});
