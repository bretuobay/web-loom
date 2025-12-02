Below is a complete, **implementation-ready Service Worker Specification** for handling **Web Push Notifications**, perfectly aligned with **@web-loom/notifications-core**.
This document defines **the contract, lifecycle, event handling, expected message shapes, integration with the client-side API, and extension points**—everything your coding agent needs to implement or scaffold a full push-enabled service worker.

---

# **Service Worker Specification for Push Notifications**

_For @web-loom/notifications-core_

---

# **1. Overview**

This specification defines the behavior, structure, and responsibilities of the **Service Worker (SW)** used to support:

- Web Push notifications
- Push payload parsing
- Notification rendering
- Click handling
- Action handling
- Notification grouping
- Silent notifications
- Background sync or future extensions

This SW is a standalone JavaScript file (e.g., `/sw.js`) served at the root or scope of your web app.

The client-side `@web-loom/notifications-core` library will:

- Register the SW
- Subscribe to push messages
- Provide helpers for SW events
- Forward actions/clicks to the client

---

# **2. Required Browser APIs**

The SW must rely on:

- Push API (`self.addEventListener('push')`)
- Notification API (`self.registration.showNotification()`)
- Notification Click API (`notificationclick`)
- Notification Close API (`notificationclose`)
- Clients API (`clients.matchAll`, `clients.openWindow`)
- Background sync (optional future extension)

---

# **3. File Format + Scope**

## **3.1 File Name**

```
/sw.js
```

## **3.2 Service Worker Scope**

Must be served at:

```
/
```

or configured via:

```ts
navigator.serviceWorker.register('/sw.js', { scope: '/' });
```

This ensures push notifications work app-wide.

---

# **4. Expected Push Payload Format**

The client/backend will send push messages structured as follows:

```json
{
  "title": "New Message",
  "options": {
    "body": "You received a new message from Alice",
    "icon": "/icons/msg.png",
    "badge": "/icons/badge.png",
    "tag": "messages:123",
    "data": {
      "url": "/inbox/123",
      "messageId": 123
    },
    "actions": [
      { "action": "open", "title": "Open" },
      { "action": "dismiss", "title": "Dismiss" }
    ],
    "silent": false,
    "requireInteraction": true
  }
}
```

### **The SW must handle:**

- `title` (string)
- `options` (NotificationOptions + custom fields)
- `options.data.url` (optional deep-link)
- `options.actions` (button actions)
- `options.tag` for grouping
- `options.silent`
- `options.requireInteraction`
- arbitrary `data` passed to events

---

# **5. Push Event Handling (Required)**

Primary entrypoint:

```ts
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};

  const title = payload.title || 'Notification';
  const options = payload.options || {};

  event.waitUntil(self.registration.showNotification(title, options));
});
```

### Requirements:

- Handle empty payloads gracefully.
- Parse JSON safely.
- Always wrap in `event.waitUntil()`.

---

# **6. Notification Click Handling**

Triggered when:

- Notification body is clicked
- Notification action button is clicked

Specification:

```ts
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // recommended

  const action = event.action; // '' for body click
  const data = event.notification.data || {};
  const url = data.url || '/';

  event.waitUntil(
    (async () => {
      // Try to find an existing tab
      const clientsList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Focus an existing tab if open
      for (const client of clientsList) {
        if ('focus' in client && client.url.includes(location.origin)) {
          return client.focus();
        }
      }

      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })(),
  );
});
```

### Requirements:

- Close the notification on click.
- Pass action + data back to client apps via URL or messaging.
- Focus existing tab if possible, fallback to opening new tab.

---

# **7. Notification Close Handling**

Triggered when user or OS dismisses it:

```ts
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data;
  // Optional: send analytic event or client message
});
```

---

# **8. Background Message Handling (Optional)**

If payload includes `background` flag:

```json
{
  "title": "Background Sync",
  "options": { "silent": true },
  "background": true
}
```

The SW may skip display:

```ts
if (payload.background) {
  // Process silently (analytics, sync, etc.)
  return;
}
```

---

# **9. Data Forwarding to Client**

Service Worker may send messages to open tabs:

```ts
clients.matchAll({ includeUncontrolled: true }).then((clients) => {
  for (const client of clients) {
    client.postMessage({
      type: 'pushreceived',
      payload,
    });
  }
});
```

The client library (`notifications.onPushReceived`) listens for this.

---

# **10. Handling Rich Actions**

When an action button is clicked:

```ts
if (event.action === 'approve') {
  // handle approval
}

if (event.action === 'dismiss') {
  // ignore
}
```

Forward to client apps:

```ts
client.postMessage({
  type: 'notificationaction',
  action: event.action,
  data,
});
```

---

# **11. Grouping & Tagging Behavior**

The library supports grouping via `options.tag`.

SW requirements:

- Display notifications with identical `tag` as replacements:
  - e.g., multiple "download progress" notifications update the same tag

---

# **12. Silent Notifications Behavior**

If `options.silent === true`:

- Notification must show **no sound**, **no vibration**
- Some browsers will not show a UI unless `requireInteraction = true`
- The SW must pass the `silent` flag unchanged

---

# **13. Offline Behavior**

SW must:

- Still trigger push events even when offline
- Queue messages to client apps when possible
- Use `clients.matchAll()` to send messages to open apps

Offline handling is mostly automatic via Service Worker APIs.

---

# **14. Error Handling Requirements**

The SW must:

- Catch all JSON parsing errors
- Gracefully ignore invalid payloads
- Never throw unhandled errors

Example:

```ts
let payload = {};
try {
  payload = event.data?.json() ?? {};
} catch (err) {
  console.error('Invalid push payload', err);
}
```

---

# **15. Security Requirements**

- SW must be served over HTTPS.
- Must validate that `event.data` is JSON (if expected).
- Must avoid executing arbitrary scripts contained in push payloads.
- Must not pull remote URLs in SW events.

---

# **16. Recommended Service Worker Template**

```ts
// sw.js (example implementation)

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch (err) {
    console.error('Invalid push payload', err);
  }

  const title = payload.title || 'Notification';
  const options = payload.options || {};

  // Forward to app clients
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });
      for (const client of allClients) {
        client.postMessage({ type: 'pushreceived', payload });
      }

      return self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  const url = data.url || '/';
  const action = event.action;

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'notificationaction',
          action,
          data,
        });
        if (client.url.includes(location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});

self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data;
  // Optional analytics
});
```

---

# **17. Extension Points**

### Future features the SW should easily support:

- Background sync (via `sync` event)
- Scheduled notifications (future browser support)
- IndexedDB storage for notification history
- Push message batching
- Silent background processing for analytics or caching

---

# **18. Summary**

This Service Worker specification defines:

- Required file structure & loader
- Push event handling
- Notification event handling (click, close)
- Rich notification UI support
- Grouping, silent mode, requireInteraction
- Data passing to client tabs
- Push subscription integration with @web-loom/notifications-core
- Error handling & security requirements
- Optional future extension points

It is fully ready for implementation by a coding agent.

---
