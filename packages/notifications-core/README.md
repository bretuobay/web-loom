# @web-loom/notifications-core

Framework-agnostic utilities for browser notifications, toast fallbacks, permission tracking, and push subscription management. It wraps the native Notifications, Permissions, and Push APIs so every Web Loom app can share a consistent way to communicate with users.

## Features

- **System notifications** with grouping, silent mode, and action support.
- **Toast integration** via a pluggable adapter for graceful fallbacks.
- **Permission tracking** that emits change events across tabs.
- **Push utilities** (service-worker registration, subscribe/unsubscribe helpers, payload events).
- **Event hooks** for notification clicks, closes, permission changes, and push payloads.
- **Framework agnostic** TypeScript API with a pre-configured singleton.

## Installation

```bash
npm install @web-loom/notifications-core
```

## Quick Start

```ts
import { notifications } from '@web-loom/notifications-core';

async function enableNotifications() {
  const state = await notifications.requestPermission();
  if (state === 'granted') {
    notifications.notify('Welcome to Web Loom', {
      body: 'Notifications are now enabled.',
      icon: '/icons/welcome.png',
    });
  } else {
    notifications.showToast('Notifications were blocked – falling back to toasts.');
  }
}
```

## Configuration

```ts
import { notifications } from '@web-loom/notifications-core';
import { toastQueue } from '@repo/ui-patterns/toast-queue';

notifications.configure({
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  serviceWorkerPath: '/sw.js',
  toastAdapter: {
    show(message, options) {
      toastQueue.add(message, options);
    },
  },
});
```

## Core API

| Method                                                            | Description                                                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `notify(title, options?)`                                         | Shows a system notification or falls back to `showToast`.                                             |
| `showToast(message, options?)`                                    | Invokes the configured toast adapter.                                                                 |
| `requestPermission()` / `getPermission()`                         | Wraps the Permissions / Notifications API.                                                            |
| `group(name)`                                                     | Returns a scoped notifier that stamps the group into the notification tag.                            |
| `onPermissionChange(cb)`                                          | React when permission changes at the OS/browser level.                                                |
| `onNotificationClick(cb)` / `onNotificationClose(cb)`             | Hooks for user interactions.                                                                          |
| `registerServiceWorker()`                                         | Registers the configured service worker for push.                                                     |
| `subscribePush()` / `unsubscribePush()` / `getPushSubscription()` | Push subscription lifecycle helpers.                                                                  |
| `onPushReceived(cb)`                                              | Receives payloads posted from the service worker.                                                     |
| `subscribe(event, cb)` / `unsubscribe(event, cb?)`                | Generic event helpers (`permissionchange`, `notificationclick`, `notificationclose`, `pushreceived`). |

## Push Integration

```ts
import { notifications, PUSH_MESSAGE_TYPE } from '@web-loom/notifications-core';

// Call once after user opts-in
const result = await notifications.subscribePush();
await fetch('/api/subscriptions', {
  method: 'POST',
  body: JSON.stringify(result.toJSON()),
});

// Listen for payloads coming from the SW
notifications.onPushReceived((payload) => {
  notifications.notify(payload.title, payload.options);
});
```

Service worker snippet:

```ts
// sw.js
self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(payload.title ?? 'Update', payload.options ?? {}));
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: PUSH_MESSAGE_TYPE, payload });
    });
  });
});
```

## Creating Additional Instances

```ts
import { createNotifications } from '@web-loom/notifications-core';

const scopedNotifications = createNotifications({
  serviceWorkerPath: '/marketing-sw.js',
});
```

## License

MIT © Festus Yeboah
