export type PermissionState = 'default' | 'granted' | 'denied';

// Mirrors the DOM NotificationAction definition but re-exported for convenience.
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface WebLoomNotificationOptions extends NotificationOptions {
  group?: string;
  data?: unknown;
  actions?: NotificationAction[];
}

export interface ToastAdapter {
  show(message: string, options?: Record<string, unknown>): void;
}

export interface NotificationsConfig {
  serviceWorkerPath?: string;
  vapidPublicKey?: string;
  toastAdapter?: ToastAdapter;
}

export interface NotificationClickEvent {
  notification: Notification;
  action: string;
}

export interface NotificationCloseEvent {
  notification: Notification;
}

export interface PushSubscriptionResult {
  subscription: PushSubscription | null;
  endpoint: string | null;
  toJSON(): PushSubscriptionJSON | null;
}

export type NotificationEventName = 'permissionchange' | 'notificationclick' | 'notificationclose' | 'pushreceived';

export interface NotificationEventMap extends Record<PropertyKey, unknown> {
  permissionchange: PermissionState;
  notificationclick: NotificationClickEvent;
  notificationclose: NotificationCloseEvent;
  pushreceived: unknown;
}
