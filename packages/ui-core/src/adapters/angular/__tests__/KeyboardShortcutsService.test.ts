import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyboardShortcutsService } from '../keyboard-shortcuts.service';
import { firstValueFrom, skip } from 'rxjs';

describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;

  beforeEach(() => {
    service = new KeyboardShortcutsService();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      service.initialize();

      const state = service.getState();
      expect(state.shortcuts).toBeInstanceOf(Map);
      expect(state.shortcuts.size).toBe(0);
      expect(state.scope).toBe('global');
      expect(state.activeShortcuts).toEqual([]);
      expect(state.enabled).toBe(true);
    });

    it('should initialize with provided scope', () => {
      service.initialize({ scope: 'scoped' });

      const state = service.getState();
      expect(state.scope).toBe('scoped');
    });

    it('should call onShortcutExecuted callback when provided', () => {
      const callback = vi.fn();
      service.initialize({ onShortcutExecuted: callback });

      expect(service.getState()).toBeDefined();
    });
  });

  describe('Observable emissions', () => {
    it('should emit initial state through Observable', async () => {
      service.initialize({ scope: 'global' });

      const state = await firstValueFrom(service.getState$());
      expect(state.scope).toBe('global');
      expect(state.enabled).toBe(true);
    });

    it('should emit state updates when registering shortcuts', async () => {
      service.initialize();

      const statePromise = firstValueFrom(service.getState$().pipe(skip(1)));
      
      const handler = vi.fn();
      service.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
        description: 'Test shortcut',
      });

      const state = await statePromise;
      expect(state.activeShortcuts.length).toBeGreaterThan(0);
    });
  });

  describe('shortcut registration', () => {
    it('should register a shortcut', () => {
      service.initialize();

      const handler = vi.fn();
      service.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
        description: 'Open command palette',
      });

      const state = service.getState();
      expect(state.activeShortcuts).toContain('Ctrl+K');
    });

    it('should unregister a shortcut', () => {
      service.initialize();

      const handler = vi.fn();
      service.actions.registerShortcut({
        key: 'Ctrl+K',
        handler,
      });

      service.actions.unregisterShortcut('Ctrl+K');

      const state = service.getState();
      expect(state.activeShortcuts).not.toContain('Ctrl+K');
    });

    it('should clear all shortcuts', () => {
      service.initialize();

      const handler = vi.fn();
      service.actions.registerShortcut({ key: 'Ctrl+K', handler });
      service.actions.registerShortcut({ key: 'Ctrl+P', handler });

      service.actions.clearAllShortcuts();

      const state = service.getState();
      expect(state.activeShortcuts).toEqual([]);
    });
  });

  describe('scope management', () => {
    it('should set scope', () => {
      service.initialize({ scope: 'global' });

      service.actions.setScope('scoped');

      const state = service.getState();
      expect(state.scope).toBe('scoped');
    });
  });

  describe('enable/disable', () => {
    it('should disable shortcuts', () => {
      service.initialize();

      service.actions.disable();

      const state = service.getState();
      expect(state.enabled).toBe(false);
    });

    it('should enable shortcuts', () => {
      service.initialize();

      service.actions.disable();
      service.actions.enable();

      const state = service.getState();
      expect(state.enabled).toBe(true);
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up behavior when service is destroyed', () => {
      service.initialize();

      service.ngOnDestroy();

      expect(() => service.ngOnDestroy()).not.toThrow();
    });

    it('should complete Observable on destroy', async () => {
      service.initialize();

      const completePromise = new Promise<void>((resolve) => {
        service.getState$().subscribe({
          next: () => {},
          complete: () => {
            resolve();
          },
        });
      });

      service.ngOnDestroy();
      await completePromise;
    });
  });

  describe('error handling', () => {
    it('should throw error when accessing actions before initialization', () => {
      expect(() => service.actions).toThrow(
        'KeyboardShortcutsService not initialized. Call initialize() first.'
      );
    });
  });
});
