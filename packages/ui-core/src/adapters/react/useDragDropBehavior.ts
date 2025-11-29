/**
 * React adapter for drag-and-drop behavior.
 */

import { useState, useEffect, useRef } from 'react';
import type {
  DragDropBehavior,
  DragDropState,
  DragDropActions,
  DragDropOptions,
} from '../../behaviors/drag-drop';
import { createDragDropBehavior } from '../../behaviors/drag-drop';

/**
 * React hook for drag-and-drop behavior.
 * 
 * Creates and manages a drag-and-drop behavior instance, automatically handling
 * subscriptions and cleanup. This hook provides drag-and-drop interaction state
 * management including drag source, drop target, drag data, and validation logic.
 * 
 * @example
 * ```tsx
 * interface CardData {
 *   id: string;
 *   title: string;
 *   column: string;
 * }
 * 
 * function KanbanBoard() {
 *   const [cards, setCards] = useState<CardData[]>([...]);
 *   
 *   const dragDrop = useDragDropBehavior({
 *     onDragStart: (itemId, data) => {
 *       console.log('Started dragging:', itemId);
 *     },
 *     onDrop: (draggedItem, dropTarget, data) => {
 *       // Move card to new column
 *       setCards(prev => prev.map(card =>
 *         card.id === draggedItem
 *           ? { ...card, column: dropTarget }
 *           : card
 *       ));
 *     },
 *     validateDrop: (draggedItem, dropTarget) => {
 *       // Custom validation logic
 *       return dropTarget !== 'locked-column';
 *     },
 *   });
 * 
 *   useEffect(() => {
 *     // Register drop zones
 *     dragDrop.actions.registerDropZone('todo');
 *     dragDrop.actions.registerDropZone('in-progress');
 *     dragDrop.actions.registerDropZone('done');
 *   }, []);
 * 
 *   return (
 *     <div className="kanban">
 *       {['todo', 'in-progress', 'done'].map(column => (
 *         <div
 *           key={column}
 *           className="column"
 *           onDragOver={(e) => {
 *             e.preventDefault();
 *             dragDrop.actions.setDragOver(column);
 *           }}
 *           onDragLeave={() => {
 *             dragDrop.actions.setDragOver(null);
 *           }}
 *           onDrop={() => {
 *             dragDrop.actions.drop(column);
 *           }}
 *         >
 *           {cards
 *             .filter(card => card.column === column)
 *             .map(card => (
 *               <div
 *                 key={card.id}
 *                 draggable
 *                 onDragStart={() => {
 *                   dragDrop.actions.startDrag(card.id, card);
 *                 }}
 *                 onDragEnd={() => {
 *                   dragDrop.actions.endDrag();
 *                 }}
 *               >
 *                 {card.title}
 *               </div>
 *             ))}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param options Configuration options for the drag-and-drop behavior.
 * @returns Drag-and-drop state and actions.
 */
export function useDragDropBehavior(
  options?: DragDropOptions
): DragDropState & { actions: DragDropActions } {
  const behaviorRef = useRef<DragDropBehavior | null>(null);
  
  // Initialize behavior only once
  if (behaviorRef.current === null) {
    behaviorRef.current = createDragDropBehavior(options);
  }

  const [state, setState] = useState<DragDropState>(() => 
    behaviorRef.current!.getState()
  );

  useEffect(() => {
    const behavior = behaviorRef.current!;
    
    // Subscribe to state changes
    const unsubscribe = behavior.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      behavior.destroy();
    };
  }, []);

  return {
    ...state,
    actions: behaviorRef.current.actions,
  };
}
