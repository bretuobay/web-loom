/**
 * Angular service for drag-and-drop behavior.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type {
  DragDropState,
  DragDropActions,
  DragDropOptions,
} from '../../behaviors/drag-drop';
import { createDragDropBehavior } from '../../behaviors/drag-drop';

/**
 * Angular service for drag-and-drop behavior.
 * 
 * Wraps the drag-and-drop behavior and exposes state as an RxJS Observable.
 * Automatically handles cleanup when the service is destroyed.
 * 
 * @example
 * ```typescript
 * interface CardData {
 *   id: string;
 *   title: string;
 *   column: string;
 * }
 * 
 * @Component({
 *   selector: 'app-kanban-board',
 *   template: `
 *     <div class="kanban">
 *       <div
 *         *ngFor="let column of columns"
 *         class="column"
 *         (dragover)="onDragOver($event, column)"
 *         (dragleave)="onDragLeave()"
 *         (drop)="onDrop(column)"
 *       >
 *         <h3>{{ column }}</h3>
 *         <div
 *           *ngFor="let card of getCardsForColumn(column)"
 *           class="card"
 *           [draggable]="true"
 *           (dragstart)="onDragStart(card)"
 *           (dragend)="onDragEnd()"
 *         >
 *           {{ card.title }}
 *         </div>
 *       </div>
 *     </div>
 *   `,
 *   providers: [DragDropBehaviorService],
 * })
 * export class KanbanBoardComponent implements OnInit {
 *   state$ = this.dragDropService.getState$();
 *   columns = ['todo', 'in-progress', 'done'];
 *   cards: CardData[] = [...];
 * 
 *   constructor(private dragDropService: DragDropBehaviorService) {
 *     this.dragDropService.initialize({
 *       onDragStart: (itemId, data) => {
 *         console.log('Started dragging:', itemId);
 *       },
 *       onDrop: (draggedItem, dropTarget, data) => {
 *         // Move card to new column
 *         this.cards = this.cards.map(card =>
 *           card.id === draggedItem
 *             ? { ...card, column: dropTarget }
 *             : card
 *         );
 *       },
 *       validateDrop: (draggedItem, dropTarget) => {
 *         // Custom validation logic
 *         return dropTarget !== 'locked-column';
 *       },
 *     });
 *   }
 * 
 *   ngOnInit() {
 *     // Register drop zones
 *     this.columns.forEach(column => {
 *       this.dragDropService.actions.registerDropZone(column);
 *     });
 *   }
 * 
 *   getCardsForColumn(column: string): CardData[] {
 *     return this.cards.filter(card => card.column === column);
 *   }
 * 
 *   onDragStart(card: CardData) {
 *     this.dragDropService.actions.startDrag(card.id, card);
 *   }
 * 
 *   onDragEnd() {
 *     this.dragDropService.actions.endDrag();
 *   }
 * 
 *   onDragOver(event: DragEvent, column: string) {
 *     event.preventDefault();
 *     this.dragDropService.actions.setDragOver(column);
 *   }
 * 
 *   onDragLeave() {
 *     this.dragDropService.actions.setDragOver(null);
 *   }
 * 
 *   onDrop(column: string) {
 *     this.dragDropService.actions.drop(column);
 *   }
 * }
 * ```
 */
@Injectable()
export class DragDropBehaviorService implements OnDestroy {
  private behavior: ReturnType<typeof createDragDropBehavior> | null = null;
  private state$ = new BehaviorSubject<DragDropState>({
    draggedItem: null,
    dropTarget: null,
    isDragging: false,
    dragData: null,
    dropZones: [],
    dragOverZone: null,
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the drag-and-drop behavior with the given options.
   * Must be called before using the service.
   * 
   * @param options Configuration options for the drag-and-drop behavior.
   */
  initialize(options?: DragDropOptions): void {
    if (this.behavior) {
      // Already initialized, clean up first
      this.cleanup();
    }

    this.behavior = createDragDropBehavior(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   * 
   * @returns Observable of drag-and-drop state.
   */
  getState$(): Observable<DragDropState> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   * 
   * @returns Current drag-and-drop state.
   */
  getState(): DragDropState {
    return this.state$.value;
  }

  /**
   * Gets the drag-and-drop actions.
   * 
   * @returns Drag-and-drop actions object.
   */
  get actions(): DragDropActions {
    if (!this.behavior) {
      throw new Error('DragDropBehaviorService not initialized. Call initialize() first.');
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
    this.state$.complete();
  }
}
