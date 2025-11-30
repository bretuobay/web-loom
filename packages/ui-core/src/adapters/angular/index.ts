/**
 * Angular Framework Adapters
 *
 * This module provides Angular services for all UI Core behaviors.
 * These services handle behavior lifecycle, expose state as RxJS Observables,
 * and implement proper cleanup with OnDestroy.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type {
  DialogState,
  DialogActions,
  DialogBehaviorOptions,
  RovingFocusState,
  RovingFocusActions,
  RovingFocusOptions,
  ListSelectionState,
  ListSelectionActions,
  ListSelectionOptions,
  DisclosureState,
  DisclosureActions,
  DisclosureBehaviorOptions,
  FormState,
  FormActions,
  FormBehaviorOptions,
} from '../../behaviors';
import {
  createDialogBehavior,
  createRovingFocus,
  createListSelection,
  createDisclosureBehavior,
  createFormBehavior,
} from '../../behaviors';

// Export new behavior services
export { KeyboardShortcutsService } from './keyboard-shortcuts.service';
export { UndoRedoStackService } from './undo-redo-stack.service';
export { DragDropBehaviorService } from './drag-drop-behavior.service';

/**
 * Angular service for dialog behavior.
 *
 * Wraps the dialog behavior and exposes state as an RxJS Observable.
 * Automatically handles cleanup when the service is destroyed.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-my-dialog',
 *   template: `
 *     <div>
 *       <button (click)="openDialog()">Open Dialog</button>
 *       <div *ngIf="(state$ | async)?.isOpen" class="dialog">
 *         <h2>{{ (state$ | async)?.content?.title }}</h2>
 *         <button (click)="closeDialog()">Close</button>
 *       </div>
 *     </div>
 *   `,
 *   providers: [DialogBehaviorService],
 * })
 * export class MyDialogComponent {
 *   state$ = this.dialogService.getState$();
 *
 *   constructor(private dialogService: DialogBehaviorService) {
 *     this.dialogService.initialize({
 *       id: 'my-dialog',
 *       onOpen: (content) => console.log('Opened:', content),
 *     });
 *   }
 *
 *   openDialog() {
 *     this.dialogService.actions.open({ title: 'Hello' });
 *   }
 *
 *   closeDialog() {
 *     this.dialogService.actions.close();
 *   }
 * }
 * ```
 */
@Injectable()
export class DialogBehaviorService implements OnDestroy {
  private behavior: ReturnType<typeof createDialogBehavior> | null = null;
  private state$ = new BehaviorSubject<DialogState>({
    isOpen: false,
    content: null,
    id: null,
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the dialog behavior with the given options.
   * Must be called before using the service.
   *
   * @param options Configuration options for the dialog behavior.
   */
  initialize(options?: DialogBehaviorOptions): void {
    if (this.behavior) {
      // Already initialized, clean up first
      this.cleanup();
    }

    this.behavior = createDialogBehavior(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   *
   * @returns Observable of dialog state.
   */
  getState$(): Observable<DialogState> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   *
   * @returns Current dialog state.
   */
  getState(): DialogState {
    return this.state$.value;
  }

  /**
   * Gets the dialog actions.
   *
   * @returns Dialog actions object.
   */
  get actions(): DialogActions {
    if (!this.behavior) {
      throw new Error('DialogBehaviorService not initialized. Call initialize() first.');
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

/**
 * Angular service for roving focus behavior.
 *
 * Wraps the roving focus behavior and exposes state as an RxJS Observable.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-menu',
 *   template: `
 *     <ul (keydown)="handleKeyDown($event)">
 *       <li
 *         *ngFor="let item of (state$ | async)?.items; let i = index"
 *         [tabindex]="(state$ | async)?.currentIndex === i ? 0 : -1"
 *       >
 *         {{ item }}
 *       </li>
 *     </ul>
 *   `,
 *   providers: [RovingFocusBehaviorService],
 * })
 * export class MenuComponent {
 *   state$ = this.rovingFocusService.getState$();
 *
 *   constructor(private rovingFocusService: RovingFocusBehaviorService) {
 *     this.rovingFocusService.initialize({
 *       items: ['item-1', 'item-2', 'item-3'],
 *       orientation: 'vertical',
 *     });
 *   }
 *
 *   handleKeyDown(event: KeyboardEvent) {
 *     if (event.key === 'ArrowDown') {
 *       this.rovingFocusService.actions.moveNext();
 *     } else if (event.key === 'ArrowUp') {
 *       this.rovingFocusService.actions.movePrevious();
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class RovingFocusBehaviorService implements OnDestroy {
  private behavior: ReturnType<typeof createRovingFocus> | null = null;
  private state$ = new BehaviorSubject<RovingFocusState>({
    currentIndex: 0,
    items: [],
    orientation: 'vertical',
    wrap: true,
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the roving focus behavior with the given options.
   *
   * @param options Configuration options for the roving focus behavior.
   */
  initialize(options?: RovingFocusOptions): void {
    if (this.behavior) {
      this.cleanup();
    }

    this.behavior = createRovingFocus(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   */
  getState$(): Observable<RovingFocusState> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   */
  getState(): RovingFocusState {
    return this.state$.value;
  }

  /**
   * Gets the roving focus actions.
   */
  get actions(): RovingFocusActions {
    if (!this.behavior) {
      throw new Error('RovingFocusBehaviorService not initialized. Call initialize() first.');
    }
    return this.behavior.actions;
  }

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

  ngOnDestroy(): void {
    this.cleanup();
    this.state$.complete();
  }
}

/**
 * Angular service for list selection behavior.
 *
 * Wraps the list selection behavior and exposes state as an RxJS Observable.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-file-list',
 *   template: `
 *     <ul>
 *       <li
 *         *ngFor="let item of (state$ | async)?.items"
 *         (click)="toggleSelection(item)"
 *         [class.selected]="isSelected(item)"
 *       >
 *         {{ item }}
 *       </li>
 *     </ul>
 *   `,
 *   providers: [ListSelectionBehaviorService],
 * })
 * export class FileListComponent {
 *   state$ = this.selectionService.getState$();
 *
 *   constructor(private selectionService: ListSelectionBehaviorService) {
 *     this.selectionService.initialize({
 *       items: ['file-1', 'file-2', 'file-3'],
 *       mode: 'multi',
 *     });
 *   }
 *
 *   toggleSelection(item: string) {
 *     this.selectionService.actions.toggleSelection(item);
 *   }
 *
 *   isSelected(item: string): boolean {
 *     return this.selectionService.getState().selectedIds.includes(item);
 *   }
 * }
 * ```
 */
@Injectable()
export class ListSelectionBehaviorService implements OnDestroy {
  private behavior: ReturnType<typeof createListSelection> | null = null;
  private state$ = new BehaviorSubject<ListSelectionState>({
    selectedIds: [],
    lastSelectedId: null,
    mode: 'single',
    items: [],
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the list selection behavior with the given options.
   */
  initialize(options?: ListSelectionOptions): void {
    if (this.behavior) {
      this.cleanup();
    }

    this.behavior = createListSelection(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   */
  getState$(): Observable<ListSelectionState> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   */
  getState(): ListSelectionState {
    return this.state$.value;
  }

  /**
   * Gets the list selection actions.
   */
  get actions(): ListSelectionActions {
    if (!this.behavior) {
      throw new Error('ListSelectionBehaviorService not initialized. Call initialize() first.');
    }
    return this.behavior.actions;
  }

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

  ngOnDestroy(): void {
    this.cleanup();
    this.state$.complete();
  }
}

/**
 * Angular service for disclosure behavior.
 *
 * Wraps the disclosure behavior and exposes state as an RxJS Observable.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-accordion',
 *   template: `
 *     <div>
 *       <button (click)="toggle()">
 *         {{ (state$ | async)?.isExpanded ? 'Collapse' : 'Expand' }}
 *       </button>
 *       <div *ngIf="(state$ | async)?.isExpanded" class="content">
 *         Expandable content here
 *       </div>
 *     </div>
 *   `,
 *   providers: [DisclosureBehaviorService],
 * })
 * export class AccordionComponent {
 *   state$ = this.disclosureService.getState$();
 *
 *   constructor(private disclosureService: DisclosureBehaviorService) {
 *     this.disclosureService.initialize({
 *       id: 'section-1',
 *     });
 *   }
 *
 *   toggle() {
 *     this.disclosureService.actions.toggle();
 *   }
 * }
 * ```
 */
@Injectable()
export class DisclosureBehaviorService implements OnDestroy {
  private behavior: ReturnType<typeof createDisclosureBehavior> | null = null;
  private state$ = new BehaviorSubject<DisclosureState>({
    isExpanded: false,
    id: null,
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the disclosure behavior with the given options.
   */
  initialize(options?: DisclosureBehaviorOptions): void {
    if (this.behavior) {
      this.cleanup();
    }

    this.behavior = createDisclosureBehavior(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   */
  getState$(): Observable<DisclosureState> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   */
  getState(): DisclosureState {
    return this.state$.value;
  }

  /**
   * Gets the disclosure actions.
   */
  get actions(): DisclosureActions {
    if (!this.behavior) {
      throw new Error('DisclosureBehaviorService not initialized. Call initialize() first.');
    }
    return this.behavior.actions;
  }

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

  ngOnDestroy(): void {
    this.cleanup();
    this.state$.complete();
  }
}

/**
 * Angular service for form behavior.
 *
 * Wraps the form behavior and exposes state as an RxJS Observable.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-login-form',
 *   template: `
 *     <form (submit)="onSubmit($event)">
 *       <input
 *         type="email"
 *         [value]="(state$ | async)?.values.email"
 *         (input)="setEmail($event)"
 *         (blur)="touchEmail()"
 *       />
 *       <span *ngIf="(state$ | async)?.touched.email && (state$ | async)?.errors.email" class="error">
 *         {{ (state$ | async)?.errors.email }}
 *       </span>
 *
 *       <input
 *         type="password"
 *         [value]="(state$ | async)?.values.password"
 *         (input)="setPassword($event)"
 *         (blur)="touchPassword()"
 *       />
 *       <span *ngIf="(state$ | async)?.touched.password && (state$ | async)?.errors.password" class="error">
 *         {{ (state$ | async)?.errors.password }}
 *       </span>
 *
 *       <button
 *         type="submit"
 *         [disabled]="!(state$ | async)?.isValid || (state$ | async)?.isSubmitting"
 *       >
 *         {{ (state$ | async)?.isSubmitting ? 'Submitting...' : 'Login' }}
 *       </button>
 *     </form>
 *   `,
 *   providers: [FormBehaviorService],
 * })
 * export class LoginFormComponent {
 *   state$ = this.formService.getState$();
 *
 *   constructor(private formService: FormBehaviorService<{ email: string; password: string }>) {
 *     this.formService.initialize({
 *       initialValues: { email: '', password: '' },
 *       fields: {
 *         email: {
 *           validate: (value) => {
 *             if (!value) return 'Email is required';
 *             if (!value.includes('@')) return 'Invalid email';
 *             return null;
 *           },
 *         },
 *         password: {
 *           validate: (value) => {
 *             if (!value) return 'Password is required';
 *             if (value.length < 8) return 'Password must be at least 8 characters';
 *             return null;
 *           },
 *         },
 *       },
 *       onSubmit: async (values) => {
 *         console.log('Submitting:', values);
 *       },
 *     });
 *   }
 *
 *   setEmail(event: Event) {
 *     const value = (event.target as HTMLInputElement).value;
 *     this.formService.actions.setFieldValue('email', value);
 *   }
 *
 *   setPassword(event: Event) {
 *     const value = (event.target as HTMLInputElement).value;
 *     this.formService.actions.setFieldValue('password', value);
 *   }
 *
 *   touchEmail() {
 *     this.formService.actions.setFieldTouched('email', true);
 *   }
 *
 *   touchPassword() {
 *     this.formService.actions.setFieldTouched('password', true);
 *   }
 *
 *   onSubmit(event: Event) {
 *     event.preventDefault();
 *     this.formService.actions.submitForm();
 *   }
 * }
 * ```
 */
@Injectable()
export class FormBehaviorService<T extends Record<string, any> = Record<string, any>> implements OnDestroy {
  private behavior: ReturnType<typeof createFormBehavior<T>> | null = null;
  private state$ = new BehaviorSubject<FormState<T>>({
    values: {} as T,
    errors: {},
    touched: {},
    dirty: {},
    isValidating: false,
    isValid: true,
    isSubmitting: false,
    submitCount: 0,
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the form behavior with the given options.
   */
  initialize(options: FormBehaviorOptions<T>): void {
    if (this.behavior) {
      this.cleanup();
    }

    this.behavior = createFormBehavior<T>(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   */
  getState$(): Observable<FormState<T>> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   */
  getState(): FormState<T> {
    return this.state$.value;
  }

  /**
   * Gets the form actions.
   */
  get actions(): FormActions<T> {
    if (!this.behavior) {
      throw new Error('FormBehaviorService not initialized. Call initialize() first.');
    }
    return this.behavior.actions;
  }

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

  ngOnDestroy(): void {
    this.cleanup();
    this.state$.complete();
  }
}
