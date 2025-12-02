Below is a complete, **coding-agent-friendly, implementation-ready API Reference** for **@web-loom/notifications-core**.
It includes:

- Namespaces
- Interfaces & types
- Methods
- Events
- Permission APIs
- Push subscription APIs
- Toast integration
- Rich notification actions
- Silent/group notifications
- Service worker bindings

This can be used directly as a blueprint for building the library.

---

# **@web-loom/notifications-core – API Reference**

Lightweight, framework-agnostic utilities for browser notifications, permissions, push notifications, and toast integration.

---

# **1. Module Overview**

```ts
import { notifications, createNotifications, NotificationManager } from '@web-loom/notifications-core';
```

Exports include:

- `notifications`: a default singleton manager
- `createNotifications()`: create additional isolated instances
- Notification permission utilities
- Push subscription utilities
- Toast binding helpers
- Event emitters
- Types for push subscription, rich notifications, and actions

---

# **2. Core Types & Interfaces**

---

## **2.1 NotificationOptions**

Wrapper around native `NotificationOptions`, plus enhancements:

```ts
export interface WebLoomNotificationOptions extends NotificationOptions {
  silent?: boolean;
  group?: string; // custom grouping tag
  data?: any; // arbitrary payload for click handlers
  actions?: NotificationAction[];
}
```

---

## **2.2 NotificationAction**

```ts
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}
```

---

## **2.3 PermissionState**

```ts
export type PermissionState = 'default' | 'granted' | 'denied';
```

---

## **2.4 PushSubscriptionResult**

```ts
export interface PushSubscriptionResult {
  subscription: PushSubscription | null;
  endpoint: string | null;
  toJSON(): any;
}
```

---

## **2.5 NotificationsConfig**

```ts
export interface NotificationsConfig {
  serviceWorkerPath?: string; // default: '/sw.js'
  vapidPublicKey?: string; // required for push subscription
  toastAdapter?: ToastAdapter; // link to toast queue
}
```

---

## **2.6 ToastAdapter**

A minimal adapter to integrate existing toast queue.

```ts
export interface ToastAdapter {
  show(message: string, options?: any): void;
}
```

---

---

# **3. Creating a Notification Manager**

```ts
const mgr = createNotifications({
  serviceWorkerPath: '/sw.js',
  vapidPublicKey: 'PUBLIC_KEY',
  toastAdapter: {
    show: (msg) => toastQueue.add(msg),
  },
});
```

Or use the default singleton:

```ts
notifications.showToast('Hello');
notifications.notify('Welcome!');
```

---

# **4. Core NotificationManager API**

## **4.1 notify(title, options?)**

Creates a **system notification** if permissions are granted, otherwise falls back to toast.

```ts
notifications.notify('New Message', {
  body: 'You have a new message!',
  icon: '/icons/message.png',
  silent: false,
  group: 'messages',
  data: { conversationId: 123 },
});
```

Returns:

- A Promise<Notification | null>

---

## **4.2 showToast(message, options?)**

Directly show an in-app toast.

```ts
notifications.showToast('Settings saved');
```

Requires `toastAdapter`.

---

## **4.3 requestPermission()**

```ts
const status = await notifications.requestPermission();
// 'granted' | 'denied' | 'default'
```

Shows browser permission dialog if possible.

---

## **4.4 getPermission()**

Returns **cached or current** permission state.

```ts
notifications.getPermission();
// 'granted'
```

---

## **4.5 onPermissionChange(callback)**

Subscribes to permission changes (reactive).

```ts
const unsubscribe = notifications.onPermissionChange((state) => {
  console.log('Permission changed:', state);
});
```

---

---

# **5. Rich Notification Features**

## **5.1 actions (buttons)**

```ts
notifications.notify('Friend Request', {
  body: 'Alice wants to follow you.',
  actions: [
    { action: 'approve', title: 'Approve' },
    { action: 'ignore', title: 'Ignore' },
  ],
});
```

---

## **5.2 onNotificationClick(callback)**

Triggered when a notification is clicked.

```ts
notifications.onNotificationClick((event) => {
  const { action, notification } = event;
  if (action === 'approve') handleApprove(notification.data.userId);
});
```

Event type:

```ts
export interface NotificationClickEvent {
  notification: Notification;
  action: string; // '' if main body click
}
```

---

## **5.3 onNotificationClose(callback)**

Triggered when notification is dismissed.

```ts
notifications.onNotificationClose((event) => {
  console.log('Notification closed');
});
```

---

---

# **6. Notification Grouping**

## **6.1 grouped.notify(groupName, title, options?)**

```ts
notifications.group('downloads').notify('File Complete', {
  body: 'report.pdf downloaded',
});
```

Group is stored in NotificationOptions.tag.

---

## **6.2 notifications.group(name)**

Returns a scoped manager:

```ts
const updates = notifications.group('updates');

updates.notify('New Update Available');
```

---

---

# **7. Silent Notifications**

Simply set:

```ts
notifications.notify('Background Sync Complete', {
  silent: true,
});
```

Silent notifications will:

- Not play sound
- Not vibrate
- May not display a UI depending on browser

---

---

# **8. Push Notification API**

Relies on:

- Push API
- Web Push protocol
- Service Worker registration

---

## **8.1 registerServiceWorker()**

```ts
const sw = await notifications.registerServiceWorker();
```

Returns the active ServiceWorkerRegistration.

---

## **8.2 subscribePush()**

```ts
const result = await notifications.subscribePush();
```

Returns:

```ts
{
  subscription: PushSubscription,
  endpoint: string,
  toJSON: () => { ... }
}
```

Automatically:

- Registers service worker (if not registered)
- Uses `vapidPublicKey`
- Calls `pushManager.subscribe`

---

## **8.3 unsubscribePush()**

```ts
await notifications.unsubscribePush();
```

---

## **8.4 getPushSubscription()**

Returns current subscription:

```ts
const sub = await notifications.getPushSubscription();
```

---

## **8.5 onPushReceived(callback)**

Trigger when push event arrives (Service Worker integration required).

```ts
notifications.onPushReceived((payload) => {
  console.log('Push payload:', payload);
});
```

Payload extracted from Service Worker `push` event.

---

# **9. Service Worker Integration (sw.js)**

Example sw.js (served separately):

```ts
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener('notificationclick', (event) => {
  clients.openWindow(data.url || '/');
});
```

The library exposes helper code snippets but not a full SW bundler.

---

---

# **10. Toast Integration**

Attach a toast adapter:

```ts
notifications.configure({
  toastAdapter: {
    show(message, opts) {
      toastQueue.add(message, opts);
    },
  },
});
```

**Automatic fallback**:

- If system notification permission is denied → falls back to toast
- If Notifications API unsupported → falls back to toast

---

---

# **11. Event API**

## **11.1 notifications.subscribe(eventName, callback)**

Events include:

- `"permissionchange"`
- `"notificationclick"`
- `"notificationclose"`
- `"pushreceived"`

```ts
const unsub = notifications.subscribe('notificationclick', (event) => {
  console.log(event);
});
```

---

## **11.2 notifications.unsubscribe(callback)**

Manual unsubscribe.

---

---

# **12. Global Singleton: notifications**

Identical API to NotificationManager instance:

```ts
notifications.notify(...)
notifications.subscribe(...)
notifications.requestPermission()
notifications.subscribePush()
notifications.showToast()
notifications.group('updates')
```

Included by default, created with no config.

---

---

# **13. Example: Basic usage**

```ts
notifications.requestPermission().then((state) => {
  if (state === 'granted') {
    notifications.notify('Welcome!', {
      body: 'Thanks for allowing notifications',
      icon: '/icons/welcome.png',
    });
  } else {
    notifications.showToast('Notifications disabled');
  }
});
```

---

# **14. Example: Push subscription**

```ts
const result = await notifications.subscribePush();

await fetch('/api/save-subscription', {
  method: 'POST',
  body: JSON.stringify(result.toJSON()),
});
```

---

# **15. Example: Toast fallback**

```ts
notifications
  .notify('Update available', {
    body: 'Click to refresh',
  })
  .catch(() => {
    notifications.showToast('Update available');
  });
```

---

# **16. Future Extensions**

This API leaves room for:

- Notification channels
- Scheduled notifications (when browsers support it)
- Inbox-style notification storage
- Analytics integration (notification click-through)
- Cross-device syncing

---

# **17. Summary**

This API reference defines:

- A complete NotificationManager class
- System notifications
- Toast integration
- Push notifications
- Permission management
- Rich notification actions
- Grouping & silent mode
- Service Worker support
- Event hooks
- A singleton interface + factory creation

It is ready for coding-agent implementation.

---
