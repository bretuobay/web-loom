Below is a complete, professional, and implementation-oriented **Product Requirements Document (PRD)** for **Notifications & Toast Management**, based on the requirements you provided.

---

# **Product Requirements Document (PRD)**

## **12. Notifications & Toast Management**

---

## **1. Overview**

Modern web applications rely on both **in-app toasts** and **system-level notifications** to deliver time-sensitive information, alerts, or confirmations. Currently, the platform only supports in-app toast queues (via `toast-queue.ts` in `ui-patterns`). There is **no support for system notifications, browser push notifications, permission handling, or rich notification interactions.**

The **Notifications & Toast Management** module will unify in-app and system-level notification behavior under a lightweight, framework-agnostic system built into **@web-loom/notifications-core**.

This module will offer:

- consistent APIs for browser notifications
- push subscriptions (e.g., for Web Push)
- notification permissions and management
- passive or “silent” notifications
- integration with the current toast queue
- rich notification actions and grouping

---

## **2. Goals & Objectives**

### **Primary Goals**

- Implement a **browser-native notification wrapper** (Notifications API + Permissions API).
- Provide **push notification subscription utilities** using the Push API + Service Workers.
- Support **rich notifications** with actions, icons, vibration patterns, and interaction callbacks.
- Create a unified **Toast + System Notification management** layer.
- Enable **notification grouping** (e.g., batch messages, task updates).
- Provide clear **permission management and permission state tracking**.
- Offer a **lightweight, framework-agnostic API** consistent across all apps.

### **Secondary Goals**

- Provide default UI patterns for toast integration (optional).
- Provide fallback logic when system notifications are unavailable.
- Ensure accessibility and cross-browser degradation.

---

## **3. Non-Goals**

- Creating a backend push service (this is assumed provided by the app/backend).
- Building a complex in-app notification center (out of scope).
- Providing advanced scheduling (e.g., scheduled notifications) beyond what browsers support.
- Mobile-native notification channels (only web standards).

---

## **4. Current State**

### **Existing Tools**

- `ui-patterns/toast-queue.ts` offers:
  - Simple in-app toasts
  - Queue management
  - Display logic

### **Missing Capabilities**

- Browser notification integration
- Push subscription (VAPID keys, Service Worker registration)
- Permission request UI
- Rich notification actions
- Cross-tab notification state management
- Notification grouping or batching

---

## **5. Why It Matters**

Notifications are essential to:

- Alert users about critical system states (errors, warnings, updates).
- Deliver background updates (messages, events, job completions).
- Support real-time collaboration workflows.
- Improve engagement through push notifications.
- Provide continuity of experience when the tab/app isn’t in focus.

Without a unified system:

- Apps implement notifications inconsistently.
- Developers duplicate logic for permissions & subscriptions.
- User experience becomes fragmented.

---

## **6. Product Scope**

### **6.1 Notifications API Wrapper**

A thin wrapper around the browser’s `Notification` API.

Capabilities:

- Create notifications (`notify(title, options)`).
- Provide fallback to in-app toast if permission is denied.
- Support all Notification options:
  - icon, badge, image
  - actions
  - vibrate patterns
  - renotify, tag, requireInteraction
  - silent mode

---

### **6.2 Permission Management**

Use the Permissions API (`navigator.permissions`).

Features:

- Check permission: `notifications.getPermission()`
- Request permission: `notifications.requestPermission()`
- Reactively track changes when OS/browser permission changes.
- Emit events when permission state changes.

---

### **6.3 Push Notification Subscription**

Based on:

- Browser Push API
- Web Push protocol
- Service Workers

Features:

- Register Service Worker for push events.
- Subscribe user (with VAPID public key).
- Unsubscribe.
- Serialize subscription to send to backend.
- Check current subscription state.

---

### **6.4 Rich Notifications with Actions**

Support:

- Multiple actions
- Click callbacks
- Close callbacks
- Deep linking
- Action-based routing (e.g., “Mark as Read”)

---

### **6.5 Notification Grouping**

Allow logically grouping notifications:

- by tag (`tag: "chat:123"`)
- or via custom grouping logic

Helper:

```ts
notifications.group('updates').notify(...)
```

---

### **6.6 Silent Notifications**

Control `silent: true` state for:

- background notifications
- low-distraction updates
- rate-limited notifications

---

### **6.7 Integration With Toast Queue**

Provide unified API:

```ts
notifications.toast("Logged in successfully");
notifications.system("New message received", { icon: ... });
notifications.push.subscribe();
```

Toast and system notifications should be complementary:

- fallback to toast if system permission denied
- option to mirror system notifications as toasts inside the UI

---

## **7. Architecture & Integration**

### **Suggested Package**

- **@web-loom/notifications-core**

### **Design Philosophy**

- Framework agnostic
- Minimal & extensible
- Built around native browser APIs
- Lightweight and modular
- Pluggable toast adapter

---

### **High-level Architecture**

```
+-----------------------------------------------------+
|                  App / UI Framework                 |
+-----------------------------------------------------+
         |                |                 |
         v                v                 v
   Toast Adapter   Component Bindings   Push UI Actions
                integrate into:
         @web-loom/notifications-core
                 /          \
                v            v
   Browser Notification API   Push API + Service Worker
                \            /
                 +----------+
                 | Permission Manager |
                 +----------+
```

---

## **8. Requirements**

### **Functional Requirements**

| ID   | Requirement                               | Priority |
| ---- | ----------------------------------------- | -------- |
| FR1  | Wrapper for Notification API              | P0       |
| FR2  | Permission checking + requesting          | P0       |
| FR3  | Push subscription (subscribe/unsubscribe) | P0       |
| FR4  | Register Service Worker for push          | P0       |
| FR5  | Rich notifications (actions, callbacks)   | P1       |
| FR6  | Notification grouping                     | P1       |
| FR7  | Silent notifications                      | P1       |
| FR8  | Integration with toast queue              | P1       |
| FR9  | Fallback to toast if blocked              | P0       |
| FR10 | Reactive permission status                | P1       |
| FR11 | Must work without any framework           | P0       |

---

### **Non-Functional Requirements**

| Requirement          | Description                             |
| -------------------- | --------------------------------------- |
| Lightweight          | <5 KB gzip for core                     |
| Non-blocking         | Must not block UI thread                |
| Graceful degradation | Full fallback when unsupported          |
| Secure               | Uses HTTPS and service workers for push |
| Stable               | Must handle browser quirks              |

---

## **9. User Stories**

### **As a user:**

- _I want to receive important updates even if the app is minimized or out of focus._
- _I want to control notification permissions._

### **As a developer:**

1. _I want to show toasts easily for quick UX feedback._
2. _I want to request system notification permission using a simple API._
3. _I want to subscribe users to push notifications using a single function call._
4. _I want rich actions on notifications so users can interact without opening the app._
5. _I want a fallback path when system notifications are blocked._
6. _I want a unified notification interface across frameworks._

---

## **10. Open Questions**

- Should we include a built-in Service Worker template?
- Should we handle vague browser permission states (e.g., “default”) with custom UX flows?
- Should push subscription auto-renew when expired?
- Should toast behavior be throttle/debounce configurable?

---

## **11. Appendix**

### **Suggested Package**

- **@web-loom/notifications-core**
  Lightweight, framework-agnostic utilities for system notifications, push notifications, permissions, and toast integration.

---

If you'd like, I can also produce:

- A **detailed API reference** for @web-loom/notifications-core
- A **service worker specification** for push notifications
- A **TypeScript design & implementation scaffolding**
- A **toast + system notification unification architecture**

Just tell me what you need next!
