import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { createDragDropBehavior } from '../drag-drop';

describe('createDragDropBehavior', () => {
  describe('initial state', () => {
    it('should initialize with default state', () => {
      const dragDrop = createDragDropBehavior();
      const state = dragDrop.getState();

      expect(state.draggedItem).toBeNull();
      expect(state.dropTarget).toBeNull();
      expect(state.isDragging).toBe(false);
      expect(state.dragData).toBeNull();
      expect(state.dropZones).toEqual([]);
      expect(state.dragOverZone).toBeNull();
    });
  });

  describe('registerDropZone action', () => {
    it('should register a drop zone', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.registerDropZone('zone-1');
      const state = dragDrop.getState();

      expect(state.dropZones).toContain('zone-1');
      expect(state.dropZones.length).toBe(1);
    });

    it('should register multiple drop zones', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.registerDropZone('zone-2');
      dragDrop.actions.registerDropZone('zone-3');

      const state = dragDrop.getState();
      expect(state.dropZones).toEqual(['zone-1', 'zone-2', 'zone-3']);
    });

    it('should warn when registering duplicate drop zone', () => {
      const dragDrop = createDragDropBehavior();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.registerDropZone('zone-1');

      expect(consoleSpy).toHaveBeenCalledWith('Drop zone zone-1 is already registered');
      expect(dragDrop.getState().dropZones.length).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('unregisterDropZone action', () => {
    it('should unregister a drop zone', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.registerDropZone('zone-2');
      dragDrop.actions.unregisterDropZone('zone-1');

      const state = dragDrop.getState();
      expect(state.dropZones).toEqual(['zone-2']);
    });

    it('should warn when unregistering non-existent drop zone', () => {
      const dragDrop = createDragDropBehavior();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dragDrop.actions.unregisterDropZone('zone-1');

      expect(consoleSpy).toHaveBeenCalledWith('Drop zone zone-1 is not registered');

      consoleSpy.mockRestore();
    });
  });

  describe('startDrag action', () => {
    it('should start drag operation', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.startDrag('item-1');
      const state = dragDrop.getState();

      expect(state.isDragging).toBe(true);
      expect(state.draggedItem).toBe('item-1');
      expect(state.dragData).toBeNull();
    });

    it('should start drag with data', () => {
      const dragDrop = createDragDropBehavior();
      const data = { type: 'card', priority: 'high' };

      dragDrop.actions.startDrag('item-1', data);
      const state = dragDrop.getState();

      expect(state.isDragging).toBe(true);
      expect(state.draggedItem).toBe('item-1');
      expect(state.dragData).toEqual(data);
    });

    it('should invoke onDragStart callback', () => {
      const onDragStart = vi.fn();
      const dragDrop = createDragDropBehavior({ onDragStart });
      const data = { type: 'card' };

      dragDrop.actions.startDrag('item-1', data);

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDragStart).toHaveBeenCalledWith('item-1', data);
    });

    it('should invoke onDragStart with null data when no data provided', () => {
      const onDragStart = vi.fn();
      const dragDrop = createDragDropBehavior({ onDragStart });

      dragDrop.actions.startDrag('item-1');

      expect(onDragStart).toHaveBeenCalledWith('item-1', null);
    });

    it('should warn when starting drag while already dragging', () => {
      const dragDrop = createDragDropBehavior();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.startDrag('item-2');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot start drag: drag operation already in progress'
      );
      expect(dragDrop.getState().draggedItem).toBe('item-1');

      consoleSpy.mockRestore();
    });
  });

  describe('endDrag action', () => {
    it('should end drag operation', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.startDrag('item-1', { type: 'card' });
      dragDrop.actions.endDrag();

      const state = dragDrop.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedItem).toBeNull();
      expect(state.dragData).toBeNull();
      expect(state.dropTarget).toBeNull();
      expect(state.dragOverZone).toBeNull();
    });

    it('should invoke onDragEnd callback', () => {
      const onDragEnd = vi.fn();
      const dragDrop = createDragDropBehavior({ onDragEnd });

      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.endDrag();

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledWith('item-1');
    });

    it('should warn when ending drag without active drag', () => {
      const dragDrop = createDragDropBehavior();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dragDrop.actions.endDrag();

      expect(consoleSpy).toHaveBeenCalledWith('Cannot end drag: no active drag operation');

      consoleSpy.mockRestore();
    });
  });

  describe('setDropTarget action', () => {
    it('should set drop target', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.setDropTarget('zone-1');
      const state = dragDrop.getState();

      expect(state.dropTarget).toBe('zone-1');
    });

    it('should clear drop target when set to null', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.setDropTarget('zone-1');
      dragDrop.actions.setDropTarget(null);

      expect(dragDrop.getState().dropTarget).toBeNull();
    });
  });

  describe('setDragOver action', () => {
    it('should set drag over zone', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.setDragOver('zone-1');
      const state = dragDrop.getState();

      expect(state.dragOverZone).toBe('zone-1');
    });

    it('should clear drag over zone when set to null', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.setDragOver('zone-1');
      dragDrop.actions.setDragOver(null);

      expect(dragDrop.getState().dragOverZone).toBeNull();
    });
  });

  describe('drop action', () => {
    it('should perform drop on valid target', () => {
      const onDrop = vi.fn();
      const dragDrop = createDragDropBehavior({ onDrop });

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.startDrag('item-1', { type: 'card' });
      dragDrop.actions.drop('zone-1');

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith('item-1', 'zone-1', { type: 'card' });
    });

    it('should end drag after successful drop', () => {
      const dragDrop = createDragDropBehavior();

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.drop('zone-1');

      const state = dragDrop.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedItem).toBeNull();
      expect(state.dragData).toBeNull();
    });

    it('should invoke onDragEnd after drop', () => {
      const onDragEnd = vi.fn();
      const dragDrop = createDragDropBehavior({ onDragEnd });

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.drop('zone-1');

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDragEnd).toHaveBeenCalledWith('item-1');
    });

    it('should warn when dropping without active drag', () => {
      const dragDrop = createDragDropBehavior();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.drop('zone-1');

      expect(consoleSpy).toHaveBeenCalledWith('Cannot drop: no active drag operation');

      consoleSpy.mockRestore();
    });

    it('should error when dropping on unregistered zone', () => {
      const dragDrop = createDragDropBehavior();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.drop('zone-1');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid drop target: zone-1 is not a registered drop zone'
      );

      consoleSpy.mockRestore();
    });

    it('should respect validateDrop function', () => {
      const validateDrop = vi.fn().mockReturnValue(false);
      const onDrop = vi.fn();
      const dragDrop = createDragDropBehavior({ validateDrop, onDrop });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.drop('zone-1');

      expect(validateDrop).toHaveBeenCalledWith('item-1', 'zone-1');
      expect(onDrop).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Drop validation failed for item-1 on zone-1'
      );

      consoleSpy.mockRestore();
    });

    it('should allow drop when validateDrop returns true', () => {
      const validateDrop = vi.fn().mockReturnValue(true);
      const onDrop = vi.fn();
      const dragDrop = createDragDropBehavior({ validateDrop, onDrop });

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.drop('zone-1');

      expect(validateDrop).toHaveBeenCalledWith('item-1', 'zone-1');
      expect(onDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on state changes', () => {
      const dragDrop = createDragDropBehavior();
      const listener = vi.fn();

      dragDrop.subscribe(listener);
      dragDrop.actions.startDrag('item-1');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0].isDragging).toBe(true);
      expect(lastCall[0].draggedItem).toBe('item-1');
    });

    it('should support multiple subscribers', () => {
      const dragDrop = createDragDropBehavior();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      dragDrop.subscribe(listener1);
      dragDrop.subscribe(listener2);

      dragDrop.actions.startDrag('item-1');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const dragDrop = createDragDropBehavior();
      const listener = vi.fn();

      const unsubscribe = dragDrop.subscribe(listener);
      unsubscribe();

      dragDrop.actions.startDrag('item-1');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up subscriptions when destroyed', () => {
      const dragDrop = createDragDropBehavior();
      const listener = vi.fn();

      dragDrop.subscribe(listener);
      dragDrop.destroy();

      dragDrop.actions.startDrag('item-1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const dragDrop = createDragDropBehavior();

      expect(() => {
        dragDrop.destroy();
        dragDrop.destroy();
      }).not.toThrow();
    });
  });

  describe('unit tests for specific requirements', () => {
    describe('drop zone registration/unregistration (Requirement 3.3)', () => {
      it('should handle multiple drop zone registrations and unregistrations', () => {
        const dragDrop = createDragDropBehavior();

        // Register multiple zones
        dragDrop.actions.registerDropZone('zone-1');
        dragDrop.actions.registerDropZone('zone-2');
        dragDrop.actions.registerDropZone('zone-3');

        let state = dragDrop.getState();
        expect(state.dropZones).toEqual(['zone-1', 'zone-2', 'zone-3']);

        // Unregister middle zone
        dragDrop.actions.unregisterDropZone('zone-2');
        state = dragDrop.getState();
        expect(state.dropZones).toEqual(['zone-1', 'zone-3']);

        // Unregister first zone
        dragDrop.actions.unregisterDropZone('zone-1');
        state = dragDrop.getState();
        expect(state.dropZones).toEqual(['zone-3']);

        // Unregister last zone
        dragDrop.actions.unregisterDropZone('zone-3');
        state = dragDrop.getState();
        expect(state.dropZones).toEqual([]);

        dragDrop.destroy();
      });

      it('should maintain drop zone order during registration', () => {
        const dragDrop = createDragDropBehavior();

        const zones = ['alpha', 'beta', 'gamma', 'delta'];
        zones.forEach(zone => dragDrop.actions.registerDropZone(zone));

        expect(dragDrop.getState().dropZones).toEqual(zones);

        dragDrop.destroy();
      });

      it('should not duplicate drop zones on re-registration', () => {
        const dragDrop = createDragDropBehavior();
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        dragDrop.actions.registerDropZone('zone-1');
        dragDrop.actions.registerDropZone('zone-1');
        dragDrop.actions.registerDropZone('zone-1');

        expect(dragDrop.getState().dropZones).toEqual(['zone-1']);
        expect(consoleSpy).toHaveBeenCalledTimes(2);

        consoleSpy.mockRestore();
        dragDrop.destroy();
      });
    });

    describe('invalid drop target handling (Requirement 3.6, 3.9)', () => {
      it('should reject drops on unregistered zones', () => {
        const onDrop = vi.fn();
        const dragDrop = createDragDropBehavior({ onDrop });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        dragDrop.actions.registerDropZone('valid-zone');
        dragDrop.actions.startDrag('item-1');

        // Try to drop on unregistered zone
        dragDrop.actions.drop('invalid-zone');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid drop target: invalid-zone is not a registered drop zone'
        );
        expect(onDrop).not.toHaveBeenCalled();
        expect(dragDrop.getState().isDragging).toBe(true); // Still dragging

        consoleErrorSpy.mockRestore();
        dragDrop.destroy();
      });

      it('should allow drops only on registered zones', () => {
        const onDrop = vi.fn();
        const dragDrop = createDragDropBehavior({ onDrop });

        dragDrop.actions.registerDropZone('zone-1');
        dragDrop.actions.registerDropZone('zone-2');
        dragDrop.actions.startDrag('item-1');

        // Drop on registered zone should succeed
        dragDrop.actions.drop('zone-1');

        expect(onDrop).toHaveBeenCalledWith('item-1', 'zone-1', null);
        expect(dragDrop.getState().isDragging).toBe(false);

        dragDrop.destroy();
      });

      it('should validate drops using custom validateDrop function', () => {
        const validateDrop = vi.fn((draggedItem: string, dropTarget: string) => {
          // Only allow drops on zones starting with 'allowed-'
          return dropTarget.startsWith('allowed-');
        });
        const onDrop = vi.fn();
        const dragDrop = createDragDropBehavior({ validateDrop, onDrop });
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        dragDrop.actions.registerDropZone('allowed-zone');
        dragDrop.actions.registerDropZone('restricted-zone');

        // Try to drop on restricted zone
        dragDrop.actions.startDrag('item-1');
        dragDrop.actions.drop('restricted-zone');

        expect(validateDrop).toHaveBeenCalledWith('item-1', 'restricted-zone');
        expect(onDrop).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Drop validation failed for item-1 on restricted-zone'
        );

        // Drop on allowed zone should succeed
        dragDrop.actions.drop('allowed-zone');

        expect(validateDrop).toHaveBeenCalledWith('item-1', 'allowed-zone');
        expect(onDrop).toHaveBeenCalledWith('item-1', 'allowed-zone', null);

        consoleWarnSpy.mockRestore();
        dragDrop.destroy();
      });
    });

    describe('drag without start edge case (Requirement 3.5)', () => {
      it('should warn when calling endDrag without active drag', () => {
        const dragDrop = createDragDropBehavior();
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        dragDrop.actions.endDrag();

        expect(consoleSpy).toHaveBeenCalledWith('Cannot end drag: no active drag operation');

        consoleSpy.mockRestore();
        dragDrop.destroy();
      });

      it('should warn when calling drop without active drag', () => {
        const dragDrop = createDragDropBehavior();
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        dragDrop.actions.registerDropZone('zone-1');
        dragDrop.actions.drop('zone-1');

        expect(consoleSpy).toHaveBeenCalledWith('Cannot drop: no active drag operation');

        consoleSpy.mockRestore();
        dragDrop.destroy();
      });

      it('should not invoke callbacks when ending drag without start', () => {
        const onDragEnd = vi.fn();
        const onDrop = vi.fn();
        const dragDrop = createDragDropBehavior({ onDragEnd, onDrop });

        dragDrop.actions.endDrag();

        expect(onDragEnd).not.toHaveBeenCalled();
        expect(onDrop).not.toHaveBeenCalled();

        dragDrop.destroy();
      });

      it('should maintain state consistency when operations fail', () => {
        const dragDrop = createDragDropBehavior();
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const initialState = dragDrop.getState();

        // Try to end drag without starting
        dragDrop.actions.endDrag();

        const stateAfterFailedEnd = dragDrop.getState();
        expect(stateAfterFailedEnd).toEqual(initialState);

        consoleSpy.mockRestore();
        dragDrop.destroy();
      });
    });

    describe('reordering logic (Requirement 3.7)', () => {
      it('should support list reordering by swapping positions', () => {
        interface ListItem {
          id: string;
          position: number;
          text: string;
        }

        const items: ListItem[] = [
          { id: 'item-1', position: 0, text: 'First' },
          { id: 'item-2', position: 1, text: 'Second' },
          { id: 'item-3', position: 2, text: 'Third' },
          { id: 'item-4', position: 3, text: 'Fourth' },
        ];

        const onDrop = vi.fn((draggedItemId: string, dropTargetId: string, data: ListItem) => {
          // Find the dragged item and drop target
          const draggedItem = items.find(item => item.id === data.id);
          const dropTarget = items.find(item => item.id === dropTargetId);

          if (draggedItem && dropTarget) {
            // Swap positions
            const tempPosition = draggedItem.position;
            draggedItem.position = dropTarget.position;
            dropTarget.position = tempPosition;

            // Re-sort by position
            items.sort((a, b) => a.position - b.position);
          }
        });

        const dragDrop = createDragDropBehavior({ onDrop });

        // Register each item as a drop zone
        items.forEach(item => dragDrop.actions.registerDropZone(item.id));

        // Drag item-1 and drop on item-3 (swap positions)
        const draggedItem = items[0];
        dragDrop.actions.startDrag(draggedItem.id, draggedItem);
        dragDrop.actions.drop('item-3');

        expect(onDrop).toHaveBeenCalledWith('item-1', 'item-3', draggedItem);

        // Verify positions were swapped
        expect(items[0].id).toBe('item-3'); // item-3 moved to position 0
        expect(items[0].position).toBe(0);
        expect(items[2].id).toBe('item-1'); // item-1 moved to position 2
        expect(items[2].position).toBe(2);

        dragDrop.destroy();
      });

      it('should support list reordering by inserting at specific index', () => {
        const items = ['A', 'B', 'C', 'D', 'E'];

        const onDrop = vi.fn((draggedItemId: string, dropTargetId: string) => {
          const draggedIndex = items.indexOf(draggedItemId);
          const dropIndex = items.indexOf(dropTargetId);

          if (draggedIndex !== -1 && dropIndex !== -1 && draggedIndex !== dropIndex) {
            // Remove dragged item
            const [draggedItem] = items.splice(draggedIndex, 1);
            
            // Calculate new index after removal
            // If we removed an item before the drop target, the drop index shifts down by 1
            const newDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
            
            // Insert at new position
            items.splice(newDropIndex, 0, draggedItem);
          }
        });

        const dragDrop = createDragDropBehavior({ onDrop });

        // Register each item as a drop zone
        items.forEach(item => dragDrop.actions.registerDropZone(item));

        // Drag 'A' and drop on 'D' (insert before D)
        dragDrop.actions.startDrag('A');
        dragDrop.actions.drop('D');

        expect(onDrop).toHaveBeenCalledWith('A', 'D', null);

        // Verify 'A' was moved (A removed from index 0, inserted at index 2 which is before D)
        expect(items).toEqual(['B', 'C', 'A', 'D', 'E']);

        dragDrop.destroy();
      });

      it('should support reordering with drag data containing position info', () => {
        interface DragData {
          itemId: string;
          fromIndex: number;
        }

        const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

        const onDrop = vi.fn((draggedItemId: string, dropTargetId: string, data: DragData) => {
          const toIndex = parseInt(dropTargetId.split('-')[1]);
          
          if (data && data.fromIndex !== toIndex) {
            // Remove from old position
            const [item] = items.splice(data.fromIndex, 1);
            
            // Insert at new position
            items.splice(toIndex, 0, item);
          }
        });

        const dragDrop = createDragDropBehavior({ onDrop });

        // Register positions as drop zones
        for (let i = 0; i < items.length; i++) {
          dragDrop.actions.registerDropZone(`position-${i}`);
        }

        // Drag item from index 0 to index 3
        const dragData: DragData = { itemId: 'Item 1', fromIndex: 0 };
        dragDrop.actions.startDrag('item-1', dragData);
        dragDrop.actions.drop('position-3');

        expect(onDrop).toHaveBeenCalledWith('item-1', 'position-3', dragData);

        // Verify reordering
        expect(items).toEqual(['Item 2', 'Item 3', 'Item 4', 'Item 1', 'Item 5']);

        dragDrop.destroy();
      });

      it('should handle reordering in a kanban board scenario', () => {
        interface Card {
          id: string;
          title: string;
          columnId: string;
          order: number;
        }

        const cards: Card[] = [
          { id: 'card-1', title: 'Task 1', columnId: 'todo', order: 0 },
          { id: 'card-2', title: 'Task 2', columnId: 'todo', order: 1 },
          { id: 'card-3', title: 'Task 3', columnId: 'in-progress', order: 0 },
          { id: 'card-4', title: 'Task 4', columnId: 'done', order: 0 },
        ];

        const onDrop = vi.fn((draggedItemId: string, dropTargetId: string, data: Card) => {
          const card = cards.find(c => c.id === data.id);
          if (card) {
            // Update column
            card.columnId = dropTargetId;
            
            // Update order (place at end of new column)
            const cardsInColumn = cards.filter(c => c.columnId === dropTargetId);
            card.order = cardsInColumn.length - 1;
          }
        });

        const dragDrop = createDragDropBehavior({ onDrop });

        // Register columns as drop zones
        dragDrop.actions.registerDropZone('todo');
        dragDrop.actions.registerDropZone('in-progress');
        dragDrop.actions.registerDropZone('done');

        // Move card-1 from 'todo' to 'in-progress'
        const card1 = cards[0];
        dragDrop.actions.startDrag(card1.id, card1);
        dragDrop.actions.drop('in-progress');

        expect(onDrop).toHaveBeenCalledWith('card-1', 'in-progress', card1);
        expect(cards[0].columnId).toBe('in-progress');

        // Move card-3 from 'in-progress' to 'done'
        const card3 = cards[2];
        dragDrop.actions.startDrag(card3.id, card3);
        dragDrop.actions.drop('done');

        expect(onDrop).toHaveBeenCalledWith('card-3', 'done', card3);
        expect(cards[2].columnId).toBe('done');

        dragDrop.destroy();
      });

      it('should prevent reordering when validateDrop returns false', () => {
        const items = ['A', 'B', 'C', 'D'];

        const validateDrop = vi.fn((draggedItem: string, dropTarget: string) => {
          // Don't allow dropping on the same item
          return draggedItem !== dropTarget;
        });

        const onDrop = vi.fn((draggedItemId: string, dropTargetId: string) => {
          const draggedIndex = items.indexOf(draggedItemId);
          const dropIndex = items.indexOf(dropTargetId);

          if (draggedIndex !== -1 && dropIndex !== -1) {
            const [item] = items.splice(draggedIndex, 1);
            items.splice(dropIndex, 0, item);
          }
        });

        const dragDrop = createDragDropBehavior({ validateDrop, onDrop });
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        items.forEach(item => dragDrop.actions.registerDropZone(item));

        // Try to drop on same item
        dragDrop.actions.startDrag('B');
        dragDrop.actions.drop('B');

        expect(validateDrop).toHaveBeenCalledWith('B', 'B');
        expect(onDrop).not.toHaveBeenCalled();
        expect(items).toEqual(['A', 'B', 'C', 'D']); // No change

        consoleWarnSpy.mockRestore();
        dragDrop.destroy();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete drag-and-drop lifecycle', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      const onDrop = vi.fn();
      const listener = vi.fn();

      const dragDrop = createDragDropBehavior({
        onDragStart,
        onDragEnd,
        onDrop,
      });

      dragDrop.subscribe(listener);

      // Register drop zones
      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.registerDropZone('zone-2');

      expect(dragDrop.getState().dropZones).toEqual(['zone-1', 'zone-2']);

      // Start drag
      dragDrop.actions.startDrag('item-1', { type: 'card', priority: 'high' });
      expect(onDragStart).toHaveBeenCalledWith('item-1', { type: 'card', priority: 'high' });
      expect(dragDrop.getState().isDragging).toBe(true);

      // Set drop target
      dragDrop.actions.setDropTarget('zone-1');
      expect(dragDrop.getState().dropTarget).toBe('zone-1');

      // Set drag over
      dragDrop.actions.setDragOver('zone-1');
      expect(dragDrop.getState().dragOverZone).toBe('zone-1');

      // Perform drop
      dragDrop.actions.drop('zone-1');
      expect(onDrop).toHaveBeenCalledWith('item-1', 'zone-1', { type: 'card', priority: 'high' });
      expect(onDragEnd).toHaveBeenCalledWith('item-1');
      expect(dragDrop.getState().isDragging).toBe(false);

      // Clean up
      dragDrop.destroy();
    });

    it('should work as kanban board drag-and-drop', () => {
      interface CardData {
        id: string;
        title: string;
        column: string;
      }

      const cards: CardData[] = [
        { id: 'card-1', title: 'Task 1', column: 'todo' },
        { id: 'card-2', title: 'Task 2', column: 'in-progress' },
        { id: 'card-3', title: 'Task 3', column: 'done' },
      ];

      const onDrop = vi.fn((draggedItem: string, dropTarget: string, data: CardData) => {
        // Update card column
        const card = cards.find((c) => c.id === data.id);
        if (card) {
          card.column = dropTarget;
        }
      });

      const dragDrop = createDragDropBehavior({ onDrop });

      // Register columns as drop zones
      dragDrop.actions.registerDropZone('todo');
      dragDrop.actions.registerDropZone('in-progress');
      dragDrop.actions.registerDropZone('done');

      // Drag card-1 from todo to in-progress
      const card1 = cards[0];
      dragDrop.actions.startDrag(card1.id, card1);
      dragDrop.actions.drop('in-progress');

      expect(onDrop).toHaveBeenCalledWith('card-1', 'in-progress', card1);
      expect(cards[0].column).toBe('in-progress');

      dragDrop.destroy();
    });

    it('should handle drag cancellation', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      const onDrop = vi.fn();

      const dragDrop = createDragDropBehavior({
        onDragStart,
        onDragEnd,
        onDrop,
      });

      dragDrop.actions.registerDropZone('zone-1');
      dragDrop.actions.startDrag('item-1');

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(dragDrop.getState().isDragging).toBe(true);

      // Cancel drag by calling endDrag instead of drop
      dragDrop.actions.endDrag();

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(onDrop).not.toHaveBeenCalled();
      expect(dragDrop.getState().isDragging).toBe(false);

      dragDrop.destroy();
    });

    it('should handle restricted drop zones', () => {
      const validateDrop = (draggedItem: string, dropTarget: string) => {
        // Don't allow dropping on restricted zone
        return dropTarget !== 'restricted';
      };

      const onDrop = vi.fn();
      const dragDrop = createDragDropBehavior({ validateDrop, onDrop });

      dragDrop.actions.registerDropZone('allowed');
      dragDrop.actions.registerDropZone('restricted');

      // Try to drop on restricted zone
      dragDrop.actions.startDrag('item-1');
      dragDrop.actions.drop('restricted');

      expect(onDrop).not.toHaveBeenCalled();
      expect(dragDrop.getState().isDragging).toBe(true); // Still dragging

      // Drop on allowed zone
      dragDrop.actions.drop('allowed');

      expect(onDrop).toHaveBeenCalledWith('item-1', 'allowed', null);
      expect(dragDrop.getState().isDragging).toBe(false);

      dragDrop.destroy();
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: ui-core-gaps, Property 12: Drag start state transition
     * Validates: Requirements 3.4
     * 
     * For any item, when startDrag is called, isDragging should be true,
     * draggedItem should be set, and onDragStart callback should be invoked.
     */
    it('Property 12: Drag start state transition', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // itemId
          fc.anything(), // dragData
          (itemId, dragData) => {
            const onDragStart = vi.fn();
            const dragDrop = createDragDropBehavior({ onDragStart });

            // Start drag
            dragDrop.actions.startDrag(itemId, dragData);

            const state = dragDrop.getState();

            // Verify state transition
            expect(state.isDragging).toBe(true);
            expect(state.draggedItem).toBe(itemId);
            
            // The implementation normalizes undefined to null
            const expectedData = dragData === undefined ? null : dragData;
            expect(state.dragData).toEqual(expectedData);

            // Verify callback invocation
            expect(onDragStart).toHaveBeenCalledTimes(1);
            expect(onDragStart).toHaveBeenCalledWith(itemId, expectedData);

            dragDrop.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: ui-core-gaps, Property 13: Drag end state transition
     * Validates: Requirements 3.5
     * 
     * For any dragging state, when endDrag is called, isDragging should be false,
     * draggedItem should be null, and onDragEnd callback should be invoked.
     */
    it('Property 13: Drag end state transition', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // itemId
          fc.anything(), // dragData
          (itemId, dragData) => {
            const onDragEnd = vi.fn();
            const dragDrop = createDragDropBehavior({ onDragEnd });

            // Start drag first
            dragDrop.actions.startDrag(itemId, dragData);

            // End drag
            dragDrop.actions.endDrag();

            const state = dragDrop.getState();

            // Verify state transition
            expect(state.isDragging).toBe(false);
            expect(state.draggedItem).toBeNull();
            expect(state.dragData).toBeNull();
            expect(state.dropTarget).toBeNull();
            expect(state.dragOverZone).toBeNull();

            // Verify callback invocation
            expect(onDragEnd).toHaveBeenCalledTimes(1);
            expect(onDragEnd).toHaveBeenCalledWith(itemId);

            dragDrop.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: ui-core-gaps, Property 14: Drop validation
     * Validates: Requirements 3.9
     * 
     * For any drop operation, the drop should only succeed if the target
     * is a registered drop zone.
     */
    it('Property 14: Drop validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // itemId
          fc.string({ minLength: 1 }), // registeredZone
          fc.string({ minLength: 1 }), // unregisteredZone
          (itemId, registeredZone, unregisteredZone) => {
            // Ensure zones are different
            fc.pre(registeredZone !== unregisteredZone);

            const onDrop = vi.fn();
            const dragDrop = createDragDropBehavior({ onDrop });

            // Register only one zone
            dragDrop.actions.registerDropZone(registeredZone);

            // Start drag
            dragDrop.actions.startDrag(itemId);

            // Try to drop on unregistered zone - should fail
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            dragDrop.actions.drop(unregisteredZone);

            expect(onDrop).not.toHaveBeenCalled();
            expect(dragDrop.getState().isDragging).toBe(true); // Still dragging
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();

            // Drop on registered zone - should succeed
            dragDrop.actions.drop(registeredZone);

            expect(onDrop).toHaveBeenCalledTimes(1);
            expect(onDrop).toHaveBeenCalledWith(itemId, registeredZone, null);
            expect(dragDrop.getState().isDragging).toBe(false); // Drag ended

            dragDrop.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: ui-core-gaps, Property 15: Drag data preservation
     * Validates: Requirements 3.8
     * 
     * For any drag data, the data should be accessible throughout the drag
     * operation and passed to the onDrop callback.
     */
    it('Property 15: Drag data preservation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // itemId
          fc.string({ minLength: 1 }), // dropZone
          fc.anything(), // dragData
          (itemId, dropZone, dragData) => {
            const onDrop = vi.fn();
            const dragDrop = createDragDropBehavior({ onDrop });

            // Register drop zone
            dragDrop.actions.registerDropZone(dropZone);

            // Start drag with data
            dragDrop.actions.startDrag(itemId, dragData);

            // The implementation normalizes undefined to null
            const expectedData = dragData === undefined ? null : dragData;

            // Verify data is preserved in state during drag
            let state = dragDrop.getState();
            expect(state.dragData).toEqual(expectedData);

            // Perform drop
            dragDrop.actions.drop(dropZone);

            // Verify data was passed to onDrop callback
            expect(onDrop).toHaveBeenCalledTimes(1);
            expect(onDrop).toHaveBeenCalledWith(itemId, dropZone, expectedData);

            // Verify data is cleared after drop
            state = dragDrop.getState();
            expect(state.dragData).toBeNull();

            dragDrop.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
