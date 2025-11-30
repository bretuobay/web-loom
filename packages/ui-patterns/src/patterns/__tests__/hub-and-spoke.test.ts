import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubAndSpoke, type Spoke } from '../hub-and-spoke';

describe('createHubAndSpoke', () => {
  const testSpokes: Spoke[] = [
    { id: 'settings', label: 'Settings', icon: 'gear' },
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
  ];

  describe('initialization', () => {
    it('should initialize with hub state', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const state = navigation.getState();

      expect(state.isOnHub).toBe(true);
      expect(state.activeSpoke).toBe(null);
      expect(state.spokes).toEqual(testSpokes);
      expect(state.breadcrumbs).toEqual([]);
      expect(state.navigationHistory).toEqual([]);

      navigation.destroy();
    });
  });

  describe('spoke activation', () => {
    it('should activate a spoke and update state', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      const state = navigation.getState();

      expect(state.isOnHub).toBe(false);
      expect(state.activeSpoke).toBe('settings');
      expect(state.breadcrumbs).toEqual(['settings']);
      expect(state.navigationHistory).toEqual(['settings']);

      navigation.destroy();
    });

    it('should invoke onSpokeActivate callback', () => {
      const onSpokeActivate = vi.fn();
      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        onSpokeActivate,
      });

      navigation.actions.activateSpoke('profile');

      expect(onSpokeActivate).toHaveBeenCalledWith('profile');
      expect(onSpokeActivate).toHaveBeenCalledTimes(1);

      navigation.destroy();
    });

    it('should emit spoke:activated event', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const listener = vi.fn();

      navigation.eventBus.on('spoke:activated', listener);
      navigation.actions.activateSpoke('notifications');

      expect(listener).toHaveBeenCalledWith('notifications');
      expect(listener).toHaveBeenCalledTimes(1);

      navigation.destroy();
    });

    it('should warn when activating non-existent spoke', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      navigation.actions.activateSpoke('nonexistent');

      expect(consoleSpy).toHaveBeenCalledWith('Spoke with ID "nonexistent" not found');

      consoleSpy.mockRestore();
      navigation.destroy();
    });

    it('should update breadcrumbs when activating multiple spokes', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      navigation.actions.activateSpoke('profile');

      const state = navigation.getState();
      expect(state.breadcrumbs).toEqual(['settings', 'profile']);
      expect(state.activeSpoke).toBe('profile');

      navigation.destroy();
    });
  });

  describe('return to hub', () => {
    it('should return to hub and reset state', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      navigation.actions.returnToHub();

      const state = navigation.getState();
      expect(state.isOnHub).toBe(true);
      expect(state.activeSpoke).toBe(null);
      expect(state.breadcrumbs).toEqual([]);

      navigation.destroy();
    });

    it('should invoke onReturnToHub callback', () => {
      const onReturnToHub = vi.fn();
      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        onReturnToHub,
      });

      navigation.actions.activateSpoke('profile');
      navigation.actions.returnToHub();

      expect(onReturnToHub).toHaveBeenCalledTimes(1);

      navigation.destroy();
    });

    it('should emit hub:returned event', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const listener = vi.fn();

      navigation.eventBus.on('hub:returned', listener);
      navigation.actions.activateSpoke('settings');
      navigation.actions.returnToHub();

      expect(listener).toHaveBeenCalledTimes(1);

      navigation.destroy();
    });

    it('should maintain navigation history when returning to hub', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      navigation.actions.returnToHub();

      const state = navigation.getState();
      expect(state.navigationHistory).toEqual(['settings', 'hub']);

      navigation.destroy();
    });
  });

  describe('navigation history', () => {
    it('should track navigation history', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      navigation.actions.activateSpoke('profile');
      navigation.actions.returnToHub();
      navigation.actions.activateSpoke('notifications');

      const state = navigation.getState();
      expect(state.navigationHistory).toEqual(['settings', 'profile', 'hub', 'notifications']);

      navigation.destroy();
    });

    it('should go back in navigation history', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      navigation.actions.activateSpoke('profile');
      navigation.actions.goBack();

      const state = navigation.getState();
      expect(state.activeSpoke).toBe('settings');
      expect(state.breadcrumbs).toEqual(['settings']);

      navigation.destroy();
    });

    it('should return to hub when going back from first spoke', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('settings');
      navigation.actions.goBack();

      const state = navigation.getState();
      expect(state.isOnHub).toBe(true);
      expect(state.activeSpoke).toBe(null);

      navigation.destroy();
    });

    it('should warn when going back with empty history', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      navigation.actions.goBack();

      expect(consoleSpy).toHaveBeenCalledWith('Cannot go back: navigation history is empty');

      consoleSpy.mockRestore();
      navigation.destroy();
    });
  });

  describe('breadcrumb management', () => {
    it('should update breadcrumbs manually', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.updateBreadcrumbs(['settings', 'profile']);

      const state = navigation.getState();
      expect(state.breadcrumbs).toEqual(['settings', 'profile']);

      navigation.destroy();
    });

    it('should emit navigation:changed event when updating breadcrumbs', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const listener = vi.fn();

      navigation.eventBus.on('navigation:changed', listener);
      navigation.actions.updateBreadcrumbs(['settings']);

      expect(listener).toHaveBeenCalledTimes(1);

      navigation.destroy();
    });
  });

  describe('spoke management', () => {
    it('should add a new spoke', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const newSpoke: Spoke = { id: 'help', label: 'Help', icon: 'question' };

      navigation.actions.addSpoke(newSpoke);

      const state = navigation.getState();
      expect(state.spokes).toHaveLength(4);
      expect(state.spokes[3]).toEqual(newSpoke);

      navigation.destroy();
    });

    it('should warn when adding duplicate spoke', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      navigation.actions.addSpoke(testSpokes[0]);

      expect(consoleSpy).toHaveBeenCalledWith('Spoke with ID "settings" already exists');

      consoleSpy.mockRestore();
      navigation.destroy();
    });

    it('should remove a spoke', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.removeSpoke('profile');

      const state = navigation.getState();
      expect(state.spokes).toHaveLength(2);
      expect(state.spokes.find((s) => s.id === 'profile')).toBeUndefined();

      navigation.destroy();
    });

    it('should return to hub when removing active spoke', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });

      navigation.actions.activateSpoke('profile');
      navigation.actions.removeSpoke('profile');

      const state = navigation.getState();
      expect(state.isOnHub).toBe(true);
      expect(state.activeSpoke).toBe(null);

      navigation.destroy();
    });
  });

  describe('nested spokes', () => {
    it('should support nested spokes', () => {
      const nestedSpokes: Spoke[] = [
        {
          id: 'settings',
          label: 'Settings',
          subSpokes: [
            { id: 'general', label: 'General' },
            { id: 'privacy', label: 'Privacy' },
          ],
        },
      ];

      const navigation = createHubAndSpoke({ spokes: nestedSpokes });

      navigation.actions.activateSpoke('general');

      const state = navigation.getState();
      expect(state.activeSpoke).toBe('general');
      expect(state.isOnHub).toBe(false);

      navigation.destroy();
    });

    it('should remove nested spokes recursively', () => {
      const nestedSpokes: Spoke[] = [
        {
          id: 'settings',
          label: 'Settings',
          subSpokes: [
            { id: 'general', label: 'General' },
            { id: 'privacy', label: 'Privacy' },
          ],
        },
      ];

      const navigation = createHubAndSpoke({ spokes: nestedSpokes });

      navigation.actions.removeSpoke('general');

      const state = navigation.getState();
      const settingsSpoke = state.spokes.find((s) => s.id === 'settings');
      expect(settingsSpoke?.subSpokes).toHaveLength(1);
      expect(settingsSpoke?.subSpokes?.[0].id).toBe('privacy');

      navigation.destroy();
    });
  });

  describe('subscriptions', () => {
    it('should notify subscribers of state changes', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const listener = vi.fn();

      navigation.subscribe(listener);
      navigation.actions.activateSpoke('settings');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          activeSpoke: 'settings',
          isOnHub: false,
        }),
        expect.any(Object),
      );

      navigation.destroy();
    });

    it('should allow unsubscribing', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const listener = vi.fn();

      const unsubscribe = navigation.subscribe(listener);
      unsubscribe();

      navigation.actions.activateSpoke('settings');

      expect(listener).not.toHaveBeenCalled();

      navigation.destroy();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const navigation = createHubAndSpoke({ spokes: testSpokes });
      const listener = vi.fn();

      navigation.subscribe(listener);
      navigation.destroy();

      navigation.actions.activateSpoke('settings');

      // Listener should not be called after destroy
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('browser history integration (optional)', () => {
    // Mock window.history for testing
    const mockHistory = {
      pushState: vi.fn(),
      back: vi.fn(),
    };

    const mockWindow = {
      history: mockHistory,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    beforeEach(() => {
      mockHistory.pushState.mockClear();
      mockHistory.back.mockClear();
      mockWindow.addEventListener.mockClear();
      mockWindow.removeEventListener.mockClear();
    });

    it('should push state to browser history when activating spoke', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      navigation.actions.activateSpoke('settings');

      expect(mockHistory.pushState).toHaveBeenCalledWith({ spokeId: 'settings' }, '', '#settings');

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should push state to browser history when returning to hub', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      navigation.actions.activateSpoke('settings');
      navigation.actions.returnToHub();

      expect(mockHistory.pushState).toHaveBeenCalledWith({ hub: true }, '', '#hub');

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should call history.back() when using goBack', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      navigation.actions.activateSpoke('settings');
      navigation.actions.activateSpoke('profile');
      navigation.actions.goBack();

      expect(mockHistory.back).toHaveBeenCalledTimes(1);

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should register popstate event listener when browser history is enabled', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should remove popstate event listener on destroy', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      navigation.destroy();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));

      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should handle popstate events for spoke navigation', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      // Get the popstate handler that was registered
      const popstateHandler = mockWindow.addEventListener.mock.calls.find((call) => call[0] === 'popstate')?.[1];

      expect(popstateHandler).toBeDefined();

      // Simulate a popstate event for a spoke
      if (popstateHandler) {
        popstateHandler({ state: { spokeId: 'profile' } } as PopStateEvent);

        const state = navigation.getState();
        expect(state.activeSpoke).toBe('profile');
        expect(state.isOnHub).toBe(false);
      }

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should handle popstate events for hub navigation', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: true,
      });

      // Activate a spoke first
      navigation.actions.activateSpoke('settings');

      // Get the popstate handler
      const popstateHandler = mockWindow.addEventListener.mock.calls.find((call) => call[0] === 'popstate')?.[1];

      // Simulate a popstate event for hub
      if (popstateHandler) {
        popstateHandler({ state: { hub: true } } as PopStateEvent);

        const state = navigation.getState();
        expect(state.isOnHub).toBe(true);
        expect(state.activeSpoke).toBe(null);
      }

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });

    it('should not interact with browser history when disabled', () => {
      // @ts-ignore - mocking window
      global.window = mockWindow;

      const navigation = createHubAndSpoke({
        spokes: testSpokes,
        enableBrowserHistory: false,
      });

      navigation.actions.activateSpoke('settings');
      navigation.actions.returnToHub();
      navigation.actions.activateSpoke('profile');
      navigation.actions.goBack();

      // Should not have called any history methods
      expect(mockHistory.pushState).not.toHaveBeenCalled();
      expect(mockHistory.back).not.toHaveBeenCalled();
      expect(mockWindow.addEventListener).not.toHaveBeenCalled();

      navigation.destroy();
      // @ts-ignore - cleanup
      delete global.window;
    });
  });
});
