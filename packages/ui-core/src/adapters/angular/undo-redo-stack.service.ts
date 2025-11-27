/**
 * Angular service for undo/redo stack behavior.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type {
  UndoRedoStackState,
  UndoRedoStackActions,
  UndoRedoStackOptions,
} from '../../behaviors/undo-redo-stack';
import { createUndoRedoStack } from '../../behaviors/undo-redo-stack';

/**
 * Angular service for undo/redo stack behavior.
 * 
 * Wraps the undo/redo stack behavior and exposes state as an RxJS Observable.
 * Automatically handles cleanup when the service is destroyed.
 * 
 * @example
 * ```typescript
 * interface EditorState {
 *   content: string;
 *   cursor: number;
 * }
 * 
 * @Component({
 *   selector: 'app-text-editor',
 *   template: `
 *     <div>
 *       <div>
 *         <button
 *           (click)="undo()"
 *           [disabled]="!(state$ | async)?.canUndo"
 *         >
 *           Undo
 *         </button>
 *         <button
 *           (click)="redo()"
 *           [disabled]="!(state$ | async)?.canRedo"
 *         >
 *           Redo
 *         </button>
 *       </div>
 *       <textarea
 *         [value]="content"
 *         (input)="handleChange($event)"
 *       ></textarea>
 *       <p>
 *         History: {{ (state$ | async)?.past.length }} past,
 *         {{ (state$ | async)?.future.length }} future
 *       </p>
 *     </div>
 *   `,
 *   providers: [UndoRedoStackService],
 * })
 * export class TextEditorComponent {
 *   state$ = this.undoRedoService.getState$();
 *   content = '';
 * 
 *   constructor(private undoRedoService: UndoRedoStackService<EditorState>) {
 *     this.undoRedoService.initialize({
 *       initialState: { content: '', cursor: 0 },
 *       maxLength: 100,
 *       onStateChange: (state) => {
 *         this.content = state.content;
 *       },
 *     });
 *   }
 * 
 *   handleChange(event: Event) {
 *     const target = event.target as HTMLTextAreaElement;
 *     this.content = target.value;
 *     this.undoRedoService.actions.pushState({
 *       content: target.value,
 *       cursor: target.selectionStart,
 *     });
 *   }
 * 
 *   undo() {
 *     this.undoRedoService.actions.undo();
 *   }
 * 
 *   redo() {
 *     this.undoRedoService.actions.redo();
 *   }
 * }
 * ```
 */
@Injectable()
export class UndoRedoStackService<T> implements OnDestroy {
  private behavior: ReturnType<typeof createUndoRedoStack<T>> | null = null;
  private state$!: BehaviorSubject<UndoRedoStackState<T>>;
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the undo/redo stack behavior with the given options.
   * Must be called before using the service.
   * 
   * @param options Configuration options for the undo/redo stack behavior.
   */
  initialize(options: UndoRedoStackOptions<T>): void {
    if (this.behavior) {
      // Already initialized, clean up first
      this.cleanup();
    }

    this.behavior = createUndoRedoStack<T>(options);
    
    // Initialize state$ with the initial state
    if (!this.state$) {
      this.state$ = new BehaviorSubject<UndoRedoStackState<T>>(this.behavior.getState());
    } else {
      this.state$.next(this.behavior.getState());
    }

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   * 
   * @returns Observable of undo/redo stack state.
   */
  getState$(): Observable<UndoRedoStackState<T>> {
    if (!this.state$) {
      throw new Error('UndoRedoStackService not initialized. Call initialize() first.');
    }
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   * 
   * @returns Current undo/redo stack state.
   */
  getState(): UndoRedoStackState<T> {
    if (!this.state$) {
      throw new Error('UndoRedoStackService not initialized. Call initialize() first.');
    }
    return this.state$.value;
  }

  /**
   * Gets the undo/redo stack actions.
   * 
   * @returns Undo/redo stack actions object.
   */
  get actions(): UndoRedoStackActions<T> {
    if (!this.behavior) {
      throw new Error('UndoRedoStackService not initialized. Call initialize() first.');
    }
    return this.behavior.actions;
  }

  /**
   * Cleans up subscriptions and destroys the behavior.
   */
  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.behavior) {
      this.behavior.destroy();
      this.behavior = null;
    }
  }

  /**
   * Angular lifecycle hook for cleanup.
   */
  ngOnDestroy(): void {
    this.cleanup();
    if (this.state$) {
      this.state$.complete();
    }
  }
}
