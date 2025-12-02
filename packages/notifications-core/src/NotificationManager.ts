import { EventEmitter } from './eventEmitter';
import {
  type NotificationsConfig,
  type NotificationClickEvent,
  type NotificationCloseEvent,
  type NotificationEventMap,
  type NotificationEventName,
  type PermissionState,
  type PushSubscriptionResult,
  type ToastAdapter,
  type WebLoomNotificationOptions,
} from './types';

export const PUSH_MESSAGE_TYPE = 'WEB_LOOM_PUSH_PAYLOAD';
const DEFAULT_SW_PATH = '/sw.js';

type EventCallback<TKey extends NotificationEventName> = (payload: NotificationEventMap[TKey]) => void;

export class NotificationManager {
  private config: NotificationsConfig;
  private readonly events = new EventEmitter<NotificationEventMap>();
  private permissionState: PermissionState | null = null;
  private permissionStatusWatcher: PermissionStatus | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private serviceWorkerPromise: Promise<ServiceWorkerRegistration | null> | null = null;
  private serviceWorkerMessageBound = false;

  constructor(config?: NotificationsConfig) {
    this.config = {
      serviceWorkerPath: DEFAULT_SW_PATH,
      ...config,
    };
    this.permissionState = this.isNotificationSupported() ? (Notification.permission as PermissionState) : 'default';
    this.initPermissionWatcher();
    this.initServiceWorkerMessageListener();
  }

  configure(update: NotificationsConfig) {
    this.config = {
      ...this.config,
      ...update,
    };
  }

  getPermission(): PermissionState {
    if (this.isNotificationSupported()) {
      this.permissionState = Notification.permission as PermissionState;
    }
    return this.permissionState ?? 'default';
  }

  async requestPermission(): Promise<PermissionState> {
    if (!this.isNotificationSupported()) {
      this.updatePermissionState('denied');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.updatePermissionState(permission as PermissionState);
    return this.permissionState ?? 'default';
  }

  async notify(title: string, options: WebLoomNotificationOptions = {}): Promise<Notification | null> {
    if (!this.isNotificationSupported() || this.getPermission() !== 'granted') {
      this.fallbackToToast(title, options);
      return null;
    }

    const notificationOptions: NotificationOptions = { ...options };
    if (options.group && !notificationOptions.tag) {
      notificationOptions.tag = options.group;
    }

    try {
      const notification = new Notification(title, notificationOptions);
      this.bindBrowserNotificationEvents(notification);
      return notification;
    } catch (error) {
      console.error('[notifications-core] Failed to display notification', error);
      this.fallbackToToast(title, options);
      return null;
    }
  }

  showToast(message: string, options?: Record<string, unknown>) {
    this.getToastAdapter()?.show(message, options);
  }

  onPermissionChange(callback: (state: PermissionState) => void) {
    return this.subscribe('permissionchange', callback);
  }

  onNotificationClick(callback: (event: NotificationClickEvent) => void) {
    return this.subscribe('notificationclick', callback);
  }

  onNotificationClose(callback: (event: NotificationCloseEvent) => void) {
    return this.subscribe('notificationclose', callback);
  }

  onPushReceived(callback: (payload: unknown) => void) {
    return this.subscribe('pushreceived', callback);
  }

  subscribe<TKey extends NotificationEventName>(eventName: TKey, callback: EventCallback<TKey>) {
    return this.events.subscribe(eventName, callback as EventCallback<any>);
  }

  unsubscribe<TKey extends NotificationEventName>(eventName: TKey, callback?: EventCallback<TKey>) {
    this.events.unsubscribe(eventName, callback as EventCallback<any> | undefined);
  }

  group(groupName: string) {
    return {
      notify: (title: string, options?: WebLoomNotificationOptions) =>
        this.notify(title, {
          ...options,
          group: groupName,
        }),
    };
  }

  async registerServiceWorker() {
    if (!this.isServiceWorkerSupported()) {
      throw new Error('[notifications-core] Service workers are not supported in this environment');
    }

    if (this.serviceWorkerRegistration) {
      return this.serviceWorkerRegistration;
    }

    if (this.serviceWorkerPromise) {
      return this.serviceWorkerPromise;
    }

    const swPath = this.config.serviceWorkerPath ?? DEFAULT_SW_PATH;
    this.serviceWorkerPromise = navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        this.serviceWorkerRegistration = registration;
        this.initServiceWorkerMessageListener();
        return registration;
      })
      .catch((error) => {
        this.serviceWorkerPromise = null;
        throw error;
      });

    return this.serviceWorkerPromise;
  }

  async subscribePush(): Promise<PushSubscriptionResult> {
    const registration = await this.ensureServiceWorkerRegistration(true);
    if (!registration) {
      throw new Error('[notifications-core] Unable to register service worker');
    }

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      return this.toPushSubscriptionResult(existing);
    }

    const applicationServerKey = this.getApplicationServerKey();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    return this.toPushSubscriptionResult(subscription);
  }

  async unsubscribePush(): Promise<boolean> {
    const subscription = await this.getPushSubscription();
    if (!subscription) {
      return false;
    }
    return subscription.unsubscribe();
  }

  async getPushSubscription(): Promise<PushSubscription | null> {
    const registration = await this.ensureServiceWorkerRegistration(false);
    if (!registration) {
      return null;
    }
    return registration.pushManager.getSubscription();
  }

  protected fallbackToToast(title: string, options?: WebLoomNotificationOptions) {
    const message = options?.body ? `${title} — ${options.body}` : title;
    const toastAdapter = this.getToastAdapter();
    if (!toastAdapter) {
      console.warn('[notifications-core] Notifications permission denied and no toast adapter configured.');
      return;
    }
    toastAdapter.show(message, { group: options?.group, data: options?.data });
  }

  private updatePermissionState(state: PermissionState) {
    if (this.permissionState === state) {
      return;
    }
    this.permissionState = state;
    this.events.emit('permissionchange', state);
  }

  private bindBrowserNotificationEvents(notification: Notification) {
    notification.onclick = (event) => {
      event.preventDefault();
      this.events.emit('notificationclick', {
        notification,
        action: '',
      });
    };

    notification.onclose = () => {
      this.events.emit('notificationclose', { notification });
    };
  }

  private initPermissionWatcher() {
    if (!this.isBrowser() || !('permissions' in navigator) || this.permissionStatusWatcher) {
      return;
    }

    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        this.permissionStatusWatcher = status;
        this.updatePermissionState(status.state as PermissionState);
        status.addEventListener('change', () => {
          this.updatePermissionState(status.state as PermissionState);
        });
      })
      .catch(() => {
        // Permissions API unsupported or blocked.
      });
  }

  private initServiceWorkerMessageListener() {
    if (this.serviceWorkerMessageBound || !this.isServiceWorkerSupported()) {
      return;
    }

    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      if (!event.data || event.data.type !== PUSH_MESSAGE_TYPE) {
        return;
      }
      this.events.emit('pushreceived', event.data.payload);
    });
    this.serviceWorkerMessageBound = true;
  }

  private isBrowser() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  private isNotificationSupported() {
    return this.isBrowser() && 'Notification' in window;
  }

  private isServiceWorkerSupported() {
    return this.isBrowser() && 'serviceWorker' in navigator;
  }

  private getToastAdapter(): ToastAdapter | null {
    return this.config.toastAdapter ?? null;
  }

  private async ensureServiceWorkerRegistration(autoRegister: boolean) {
    if (!this.isServiceWorkerSupported()) {
      return null;
    }

    if (this.serviceWorkerRegistration) {
      return this.serviceWorkerRegistration;
    }

    if (this.serviceWorkerPromise) {
      return this.serviceWorkerPromise;
    }

    if (!autoRegister) {
      const registration = await navigator.serviceWorker.getRegistration();
      this.serviceWorkerRegistration = registration ?? null;
      return registration ?? null;
    }

    return this.registerServiceWorker();
  }

  private getApplicationServerKey() {
    const { vapidPublicKey } = this.config;
    if (!vapidPublicKey) {
      throw new Error('[notifications-core] `vapidPublicKey` must be configured before subscribing to push notifications');
    }
    return this.base64UrlToUint8Array(vapidPublicKey);
  }

  private base64UrlToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = this.decodeBase64(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private decodeBase64(value: string) {
    if (typeof atob === 'function') {
      return atob(value);
    }

    if (typeof globalThis !== 'undefined') {
      const bufferFactory = (globalThis as Record<string, any>).Buffer;
      if (bufferFactory?.from) {
        return bufferFactory.from(value, 'base64').toString('binary');
      }
    }

    throw new Error('[notifications-core] No base64 decoder available in this environment');
  }

  private toPushSubscriptionResult(subscription: PushSubscription): PushSubscriptionResult {
    return {
      subscription,
      endpoint: subscription.endpoint,
      toJSON: () => subscription?.toJSON() ?? null,
    };
  }
}
