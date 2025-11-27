/**
 * Angular service for keyboard shortcuts behavior.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type {
  KeyboardShortcutsState,
  KeyboardShortcutsActions,
  KeyboardShortcutsOptions,
} from '../../behaviors/keyboard-shortcuts';
import { createKeyboardShortcuts } from '../../behaviors/keyboard-shortcuts';

/**
 * Angular service for keyboard shortcuts behavior.
 * 
 * Wraps the keyboard shortcuts behavior and exposes state as an RxJS Observable.
 * Automatically handles cleanup when the service is destroyed.
 * 
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-command-palette',
 *   template: `
 *     <div>
 *       <button (click)="openPalette()">Open Command Palette</button>
 *       <p>Press Ctrl+K to open</p>
 *       <div *ngIf="(state$ | async)?.enabled">
 *         <p>Active shortcuts: {{ (state$ | async)?.activeShortcuts.length }}</p>
 *       </div>
 *     </div>
 *   `,
 *   providers: [KeyboardShortcutsService],
 * })
 * export class CommandPaletteComponent implements OnInit {
 *   state$ = this.keyboardShortcutsService.getState$();
 * 
 *   constructor(private keyboardShortcutsService: KeyboardShortcutsService) {
 *     this.keyboardShortcutsService.initialize({
 *       scope: 'global',
 *       onShortcutExecuted: (key) => console.log('Executed:', key),
 *     });
 *   }
 * 
 *   ngOnInit() {
 *     this.keyboardShortcutsService.actions.registerShortcut({
 *       key: 'Ctrl+K',
 *       handler: () => this.openPalette(),
 *       description: 'Open command palette',
 *       preventDefault: true,
 *     });
 * 
 *     this.keyboardShortcutsService.actions.registerShortcut({
 *       key: 'Escape',
 *       handler: () => this.closePalette(),
 *       description: 'Close command palette',
 *     });
 *   }
 * 
 *   openPalette() {
 *     // Open logic
 *   }
 * 
 *   closePalette() {
 *     // Close logic
 *   }
 * }
 * ```
 */
@Injectable()
export class KeyboardShortcutsService implements OnDestroy {
  private behavior: ReturnType<typeof createKeyboardShortcuts> | null = null;
  private state$ = new BehaviorSubject<KeyboardShortcutsState>({
    shortcuts: new Map(),
    scope: 'global',
    activeShortcuts: [],
    enabled: true,
  });
  private unsubscribe: (() => void) | null = null;

  /**
   * Initializes the keyboard shortcuts behavior with the given options.
   * Must be called before using the service.
   * 
   * @param options Configuration options for the keyboard shortcuts behavior.
   */
  initialize(options?: KeyboardShortcutsOptions): void {
    if (this.behavior) {
      // Already initialized, clean up first
      this.cleanup();
    }

    this.behavior = createKeyboardShortcuts(options);
    this.state$.next(this.behavior.getState());

    this.unsubscribe = this.behavior.subscribe((state) => {
      this.state$.next(state);
    });
  }

  /**
   * Gets the state as an RxJS Observable.
   * 
   * @returns Observable of keyboard shortcuts state.
   */
  getState$(): Observable<KeyboardShortcutsState> {
    return this.state$.asObservable();
  }

  /**
   * Gets the current state synchronously.
   * 
   * @returns Current keyboard shortcuts state.
   */
  getState(): KeyboardShortcutsState {
    return this.state$.value;
  }

  /**
   * Gets the keyboard shortcuts actions.
   * 
   * @returns Keyboard shortcuts actions object.
   */
  get actions(): KeyboardShortcutsActions {
    if (!this.behavior) {
      throw new Error('KeyboardShortcutsService not initialized. Call initialize() first.');
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
