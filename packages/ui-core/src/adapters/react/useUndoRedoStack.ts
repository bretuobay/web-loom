/**
 * React adapter for undo/redo stack behavior.
 */

import { useState, useEffect, useRef } from 'react';
import type {
  UndoRedoStackBehavior,
  UndoRedoStackState,
  UndoRedoStackActions,
  UndoRedoStackOptions,
} from '../../behaviors/undo-redo-stack';
import { createUndoRedoStack } from '../../behaviors/undo-redo-stack';

/**
 * React hook for undo/redo stack behavior.
 * 
 * Creates and manages an undo/redo stack behavior instance, automatically handling
 * subscriptions and cleanup. This hook provides state history management with
 * undo/redo operations, supporting time-travel debugging and state persistence.
 * 
 * @example
 * ```tsx
 * interface EditorState {
 *   content: string;
 *   cursor: number;
 * }
 * 
 * function TextEditor() {
 *   const [content, setContent] = useState('');
 *   
 *   const undoRedo = useUndoRedoStack<EditorState>({
 *     initialState: { content: '', cursor: 0 },
 *     maxLength: 100,
 *     onStateChange: (state) => {
 *       setContent(state.content);
 *     },
 *   });
 * 
 *   const handleChange = (newContent: string) => {
 *     setContent(newContent);
 *     undoRedo.actions.pushState({
 *       content: newContent,
 *       cursor: newContent.length,
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <div>
 *         <button
 *           onClick={undoRedo.actions.undo}
 *           disabled={!undoRedo.canUndo}
 *         >
 *           Undo
 *         </button>
 *         <button
 *           onClick={undoRedo.actions.redo}
 *           disabled={!undoRedo.canRedo}
 *         >
 *           Redo
 *         </button>
 *       </div>
 *       <textarea
 *         value={content}
 *         onChange={(e) => handleChange(e.target.value)}
 *       />
 *       <p>History: {undoRedo.past.length} past, {undoRedo.future.length} future</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @template T The type of state being tracked in the history.
 * @param options Configuration options for the undo/redo stack behavior.
 * @returns Undo/redo stack state and actions.
 */
export function useUndoRedoStack<T>(
  options: UndoRedoStackOptions<T>
): UndoRedoStackState<T> & { actions: UndoRedoStackActions<T> } {
  const behaviorRef = useRef<UndoRedoStackBehavior<T> | null>(null);
  
  // Initialize behavior only once
  if (behaviorRef.current === null) {
    behaviorRef.current = createUndoRedoStack<T>(options);
  }

  const [state, setState] = useState<UndoRedoStackState<T>>(() => 
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
