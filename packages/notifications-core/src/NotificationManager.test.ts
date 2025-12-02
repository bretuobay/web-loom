import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationManager, PUSH_MESSAGE_TYPE } from './NotificationManager';
import type { NotificationsConfig, ToastAdapter, PermissionState } from './types';

// Mock global Notification API
const createNotificationMock = () => {
  const mockNotification = vi.fn().mockImplementation((title: string, options?: NotificationOptions) => {
    const notification = {
      title,
      ...options,
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null,
      close: vi.fn(),
    };
    return notification;
  });

  (global as any).Notification = mockNotification;
  (global as any).Notification.permission = 'default';
  (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');

  return mockNotification;
};

// Mock ServiceWorker API
const createServiceWorkerMock = () => {
  const mockRegistration = {
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue({
        endpoint: 'https://example.com/push',
        toJSON: () => ({ endpoint: 'https://example.com/push' }),
        unsubscribe: vi.fn().mockResolvedValue(true),
      }),
    },
    active: { state: 'activated' },
  };

  const listeners: Array<(event: MessageEvent) => void> = [];

  (global as any).navigator = {
    serviceWorker: {
      register: vi.fn().mockResolvedValue(mockRegistration),
      getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      addEventListener: vi.fn((event: string, handler: (event: MessageEvent) => void) => {
        if (event === 'message') {
          listeners.push(handler);
        }
      }),
      dispatchMessage: (data: any) => {
        listeners.forEach((handler) => {
          handler(new MessageEvent('message', { data }));
        });
      },
    },
    permissions: {
      query: vi.fn().mockResolvedValue({
        state: 'granted',
        addEventListener: vi.fn(),
      }),
    },
  };

  return { mockRegistration, listeners };
};

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;
  let mockNotification: ReturnType<typeof createNotificationMock>;
  let mockServiceWorker: ReturnType<typeof createServiceWorkerMock>;

  beforeEach(() => {
    // Set up browser environment
    (global as any).window = global;
    mockNotification = createNotificationMock();
    mockServiceWorker = createServiceWorkerMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      notificationManager = new NotificationManager();
      expect(notificationManager).toBeInstanceOf(NotificationManager);
    });

    it('should initialize with custom config', () => {
      const config: NotificationsConfig = {
        serviceWorkerPath: '/custom-sw.js',
        vapidPublicKey: 'test-key',
      };
      notificationManager = new NotificationManager(config);
      expect(notificationManager).toBeInstanceOf(NotificationManager);
    });

    it('should initialize permission state', () => {
      notificationManager = new NotificationManager();
      expect(notificationManager.getPermission()).toBe('default');
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      notificationManager = new NotificationManager();
      const mockToast: ToastAdapter = { show: vi.fn() };

      notificationManager.configure({
        toastAdapter: mockToast,
        vapidPublicKey: 'new-key',
      });

      // Verify configuration is applied by triggering fallback
      (global as any).Notification.permission = 'denied';
      notificationManager.notify('Test', { body: 'Message' });
      expect(mockToast.show).toHaveBeenCalled();
    });
  });

  describe('getPermission', () => {
    it('should return current permission state', () => {
      (global as any).Notification.permission = 'granted';
      notificationManager = new NotificationManager();
      expect(notificationManager.getPermission()).toBe('granted');
    });

    it('should return default when notifications not supported', () => {
      delete (global as any).Notification;
      notificationManager = new NotificationManager();
      expect(notificationManager.getPermission()).toBe('default');
    });
  });

  describe('requestPermission', () => {
    it('should request and return granted permission', async () => {
      (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      notificationManager = new NotificationManager();

      const permission = await notificationManager.requestPermission();
      expect(permission).toBe('granted');
      expect((global as any).Notification.requestPermission).toHaveBeenCalled();
    });

    it('should request and return denied permission', async () => {
      (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');
      notificationManager = new NotificationManager();

      const permission = await notificationManager.requestPermission();
      expect(permission).toBe('denied');
    });

    it('should return denied when notifications not supported', async () => {
      delete (global as any).Notification;
      notificationManager = new NotificationManager();

      const permission = await notificationManager.requestPermission();
      expect(permission).toBe('denied');
    });

    it('should emit permissionchange event', async () => {
      (global as any).Notification.permission = 'default';
      (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      notificationManager = new NotificationManager();

      const callback = vi.fn();
      notificationManager.onPermissionChange(callback);

      await notificationManager.requestPermission();

      expect(callback).toHaveBeenCalledWith('granted');
    });
  });

  describe('notify', () => {
    beforeEach(() => {
      (global as any).Notification.permission = 'granted';
      notificationManager = new NotificationManager();
    });

    it('should create a notification when permission is granted', async () => {
      const notification = await notificationManager.notify('Test Title', {
        body: 'Test Body',
      });

      expect(notification).toBeDefined();
      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
      });
    });

    it('should handle notification options', async () => {
      await notificationManager.notify('Test', {
        body: 'Body',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test-tag',
      });

      expect(mockNotification).toHaveBeenCalledWith('Test', {
        body: 'Body',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test-tag',
      });
    });

    it('should set tag from group if not provided', async () => {
      await notificationManager.notify('Test', {
        group: 'test-group',
        body: 'Message',
      });

      expect(mockNotification).toHaveBeenCalledWith('Test', {
        group: 'test-group',
        body: 'Message',
        tag: 'test-group',
      });
    });

    it('should not override existing tag with group', async () => {
      await notificationManager.notify('Test', {
        group: 'test-group',
        tag: 'custom-tag',
        body: 'Message',
      });

      expect(mockNotification).toHaveBeenCalledWith('Test', {
        group: 'test-group',
        tag: 'custom-tag',
        body: 'Message',
      });
    });

    it('should fallback to toast when permission is denied', async () => {
      const mockToast: ToastAdapter = { show: vi.fn() };
      notificationManager.configure({ toastAdapter: mockToast });
      (global as any).Notification.permission = 'denied';

      const notification = await notificationManager.notify('Test', {
        body: 'Message',
      });

      expect(notification).toBeNull();
      expect(mockToast.show).toHaveBeenCalledWith('Test — Message', {
        group: undefined,
        data: undefined,
      });
    });

    it('should fallback to toast when notifications not supported', async () => {
      delete (global as any).Notification;
      const mockToast: ToastAdapter = { show: vi.fn() };
      notificationManager = new NotificationManager({ toastAdapter: mockToast });

      await notificationManager.notify('Test', { body: 'Message' });

      expect(mockToast.show).toHaveBeenCalled();
    });

    it('should warn when no toast adapter is configured', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      (global as any).Notification.permission = 'denied';

      await notificationManager.notify('Test');

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('no toast adapter configured'));

      consoleWarnSpy.mockRestore();
    });

    it('should bind click and close events', async () => {
      const notification = await notificationManager.notify('Test');

      expect(notification?.onclick).toBeDefined();
      expect(notification?.onclose).toBeDefined();
    });

    it('should handle notification creation errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockNotification.mockImplementationOnce(() => {
        throw new Error('Notification error');
      });

      const mockToast: ToastAdapter = { show: vi.fn() };
      notificationManager.configure({ toastAdapter: mockToast });

      const notification = await notificationManager.notify('Test', { body: 'Message' });

      expect(notification).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockToast.show).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('showToast', () => {
    it('should call toast adapter show method', () => {
      const mockToast: ToastAdapter = { show: vi.fn() };
      notificationManager = new NotificationManager({ toastAdapter: mockToast });

      notificationManager.showToast('Test message', { type: 'info' });

      expect(mockToast.show).toHaveBeenCalledWith('Test message', { type: 'info' });
    });

    it('should not throw when no toast adapter is configured', () => {
      notificationManager = new NotificationManager();
      expect(() => notificationManager.showToast('Test')).not.toThrow();
    });
  });

  describe('event subscriptions', () => {
    beforeEach(() => {
      notificationManager = new NotificationManager();
    });

    it('should subscribe to permissionchange event', () => {
      const callback = vi.fn();
      const unsubscribe = notificationManager.onPermissionChange(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to notificationclick event', () => {
      const callback = vi.fn();
      const unsubscribe = notificationManager.onNotificationClick(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to notificationclose event', () => {
      const callback = vi.fn();
      const unsubscribe = notificationManager.onNotificationClose(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to pushreceived event', () => {
      const callback = vi.fn();
      const unsubscribe = notificationManager.onPushReceived(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit notificationclick event when notification is clicked', async () => {
      (global as any).Notification.permission = 'granted';
      const callback = vi.fn();
      notificationManager.onNotificationClick(callback);

      const notification = await notificationManager.notify('Test');
      notification?.onclick?.(new Event('click'));

      expect(callback).toHaveBeenCalledWith({
        notification,
        action: '',
      });
    });

    it('should emit notificationclose event when notification is closed', async () => {
      (global as any).Notification.permission = 'granted';
      const callback = vi.fn();
      notificationManager.onNotificationClose(callback);

      const notification = await notificationManager.notify('Test');
      notification?.onclose?.(new Event('close'));

      expect(callback).toHaveBeenCalledWith({ notification });
    });
  });

  describe('group', () => {
    beforeEach(() => {
      (global as any).Notification.permission = 'granted';
      notificationManager = new NotificationManager();
    });

    it('should create grouped notification helper', () => {
      const groupHelper = notificationManager.group('test-group');
      expect(groupHelper).toHaveProperty('notify');
      expect(typeof groupHelper.notify).toBe('function');
    });

    it('should add group to notification options', async () => {
      const groupHelper = notificationManager.group('test-group');
      await groupHelper.notify('Test', { body: 'Message' });

      expect(mockNotification).toHaveBeenCalledWith('Test', {
        body: 'Message',
        group: 'test-group',
        tag: 'test-group',
      });
    });
  });

  describe('service worker management', () => {
    beforeEach(() => {
      notificationManager = new NotificationManager();
    });

    it('should register service worker', async () => {
      const registration = await notificationManager.registerServiceWorker();

      expect(registration).toBeDefined();
      expect((global as any).navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should use custom service worker path', async () => {
      notificationManager = new NotificationManager({
        serviceWorkerPath: '/custom-sw.js',
      });

      await notificationManager.registerServiceWorker();

      expect((global as any).navigator.serviceWorker.register).toHaveBeenCalledWith('/custom-sw.js');
    });

    it('should return existing registration', async () => {
      const firstRegistration = await notificationManager.registerServiceWorker();
      const secondRegistration = await notificationManager.registerServiceWorker();

      expect(firstRegistration).toBe(secondRegistration);
      expect((global as any).navigator.serviceWorker.register).toHaveBeenCalledTimes(1);
    });

    it('should handle registration errors', async () => {
      (global as any).navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('Registration failed'));

      await expect(notificationManager.registerServiceWorker()).rejects.toThrow('Registration failed');
    });

    it('should throw when service workers not supported', async () => {
      delete (global as any).navigator.serviceWorker;
      notificationManager = new NotificationManager();

      await expect(notificationManager.registerServiceWorker()).rejects.toThrow('Service workers are not supported');
    });
  });

  describe('push subscriptions', () => {
    beforeEach(() => {
      notificationManager = new NotificationManager({
        vapidPublicKey: 'BKxRJ9sZvZ4yWmKKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
      });
    });

    it('should subscribe to push notifications', async () => {
      const result = await notificationManager.subscribePush();

      expect(result).toBeDefined();
      expect(result.endpoint).toBe('https://example.com/push');
      expect(mockServiceWorker.mockRegistration.pushManager.subscribe).toHaveBeenCalled();
    });

    it('should return existing subscription', async () => {
      const existingSubscription = {
        endpoint: 'https://existing.com/push',
        toJSON: () => ({ endpoint: 'https://existing.com/push' }),
      };

      mockServiceWorker.mockRegistration.pushManager.getSubscription.mockResolvedValue(existingSubscription);

      const result = await notificationManager.subscribePush();

      expect(result.endpoint).toBe('https://existing.com/push');
      expect(mockServiceWorker.mockRegistration.pushManager.subscribe).not.toHaveBeenCalled();
    });

    it('should throw when vapidPublicKey is not configured', async () => {
      notificationManager = new NotificationManager();

      await expect(notificationManager.subscribePush()).rejects.toThrow('vapidPublicKey` must be configured');
    });

    it('should unsubscribe from push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://example.com/push',
        unsubscribe: vi.fn().mockResolvedValue(true),
      };

      mockServiceWorker.mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

      await notificationManager.registerServiceWorker();
      const result = await notificationManager.unsubscribePush();

      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should return false when no subscription exists', async () => {
      mockServiceWorker.mockRegistration.pushManager.getSubscription.mockResolvedValue(null);

      const result = await notificationManager.unsubscribePush();
      expect(result).toBe(false);
    });

    it('should get current push subscription', async () => {
      const mockSubscription = {
        endpoint: 'https://example.com/push',
      };

      mockServiceWorker.mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

      await notificationManager.registerServiceWorker();
      const subscription = await notificationManager.getPushSubscription();

      expect(subscription).toBe(mockSubscription);
    });
  });

  describe('service worker messages', () => {
    beforeEach(() => {
      notificationManager = new NotificationManager();
    });

    it('should handle push received messages', () => {
      const callback = vi.fn();
      notificationManager.onPushReceived(callback);

      // Simulate service worker message
      (global as any).navigator.serviceWorker.dispatchMessage({
        type: PUSH_MESSAGE_TYPE,
        payload: { title: 'Test', body: 'Message' },
      });

      expect(callback).toHaveBeenCalledWith({ title: 'Test', body: 'Message' });
    });

    it('should ignore non-push messages', () => {
      const callback = vi.fn();
      notificationManager.onPushReceived(callback);

      // Simulate non-push message
      (global as any).navigator.serviceWorker.dispatchMessage({
        type: 'OTHER_MESSAGE_TYPE',
        payload: { data: 'test' },
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    beforeEach(() => {
      notificationManager = new NotificationManager();
    });

    it('should unsubscribe from specific event', () => {
      const callback = vi.fn();
      notificationManager.subscribe('permissionchange', callback);

      notificationManager.unsubscribe('permissionchange', callback);

      // Should not be called after unsubscribe
      notificationManager.requestPermission();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe all listeners for an event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      notificationManager.subscribe('permissionchange', callback1);
      notificationManager.subscribe('permissionchange', callback2);

      notificationManager.unsubscribe('permissionchange');

      notificationManager.requestPermission();
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
