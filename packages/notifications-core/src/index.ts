import { NotificationManager, PUSH_MESSAGE_TYPE } from './NotificationManager';
import type {
  NotificationAction,
  NotificationClickEvent,
  NotificationCloseEvent,
  NotificationEventName,
  NotificationsConfig,
  PermissionState,
  PushSubscriptionResult,
  ToastAdapter,
  WebLoomNotificationOptions,
} from './types';

export { NotificationManager, PUSH_MESSAGE_TYPE };
export type {
  NotificationAction,
  NotificationClickEvent,
  NotificationCloseEvent,
  NotificationEventName,
  NotificationsConfig,
  PermissionState,
  PushSubscriptionResult,
  ToastAdapter,
  WebLoomNotificationOptions,
};

export function createNotifications(config?: NotificationsConfig) {
  return new NotificationManager(config);
}

export const notifications = createNotifications();
