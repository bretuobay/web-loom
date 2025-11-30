Below is a complete, well-structured **Product Requirements Document (PRD)** for **Device & Platform Detection** based on your notes.

---

# **Product Requirements Document (PRD)**

## **11. Device & Platform Detection**

---

## **1. Overview**

Modern web applications must dynamically adapt their UI, performance strategies, and feature availability based on the user’s device, operating system, capabilities, and environment. The **Device & Platform Detection** module will provide a unified, high-accuracy, observable API layer for determining device type, platform, browser, hardware capabilities, and environmental states such as network or battery status.

This module will serve as a foundation for responsive UI logic, feature gating, performance optimizations, and analytics segmentation. It will be built on top of or integrated with **@web-loom/platform-core**.

---

## **2. Goals & Objectives**

### **Primary Goals**

- Provide reliable **device type detection**: mobile, tablet, desktop.
- Provide **platform/OS identification**: iOS, Android, Windows, macOS, Linux.
- Provide **browser identification**: Chrome, Safari, Firefox, Edge, etc.
- Provide **capability/feature detection**: touch support, WebGL, geolocation, notifications, etc.
- Provide **environment state tracking**: network status, battery status, orientation, viewport size.
- Expose all values as **reactive/observable data sources** for seamless UI updates.

### **Secondary Goals**

- Ensure **lightweight** and **performant** implementation.
- Provide **TypeScript typedefs** and framework-agnostic APIs.
- Offer compatibility with all major browsers.

---

## **3. Non-Goals**

- Full device fingerprinting (privacy risk).
- Advanced hardware details beyond what browsers expose (CPU model, GPU brand).
- Tracking/user-level analytics.

---

## **4. Current State**

Currently, there is **no unified module** for device, platform, feature, or environment detection. Teams rely on ad hoc checks, which leads to:

- Inconsistent behavior across features.
- Duplication of logic.
- Difficulty maintaining cross-platform reliability.

---

## **5. Why It Matters**

Adaptive apps rely heavily on contextual awareness. This module enables:

- **Responsive UI logic**
  - Adjust layouts for mobile/tablet/desktop.
  - Switch to touch-optimized UI when required.

- **Feature gating**
  - Disable WebGL-heavy features when unsupported.
  - Gate geolocation, camera, or microphone access.

- **Performance optimization**
  - Avoid heavy interactions on low-capability devices.
  - Adapt media quality based on network status.

- **Improved user experience**
  - Auto-adapt orientation-sensitive layouts.
  - Reduce battery drain when low-power mode is detected.

This module establishes a predictable, reusable interface for all platform-level awareness.

---

## **6. Product Scope**

### **6.1 Device Type Detection**

- Categories:
  - `mobile`
  - `tablet`
  - `desktop`

- Derivation should use:
  - viewport size
  - user agent hints
  - touch vs keyboard characteristics
  - (future) Client Hints API

### **6.2 Platform / OS Detection**

- iOS
- Android
- Windows
- macOS
- Linux
- ChromeOS (optional)

Detection should rely on:

- user agent matching
- platform APIs
- navigator.userAgentData (if available)

### **6.3 Browser Detection**

- Chrome
- Safari
- Firefox
- Edge
- Opera
- WebView environments (Android/iOS)

### **6.4 Feature Detection**

- Touch support
- Geolocation API
- WebGL availability
- Service worker support
- Local storage + IndexedDB availability
- Device orientation support
- Notifications API
- Permissions API
- Camera and microphone access availability

Output should be a structured capabilities object.

### **6.5 Network Status Detection**

Provide observable values for:

- Online/offline state
- Effective network type (4g/3g/2g/slow-2g — based on Network Information API)
- Downlink speed estimate
- Round-trip latency estimate (if available)

Fallback: treat “online” as `navigator.onLine`.

### **6.6 Battery Status Detection**

Expose:

- current battery level (0–1)
- charging status
- charging/discharging time estimates (if supported)

Implement via the Battery Status API (with graceful fallback).

### **6.7 Viewport + Orientation Tracking**

Expose reactive values:

- viewport width / height
- CSS media query helpers
- orientation (`portrait` / `landscape`)
- devicePixelRatio

Should update on resize/orientationchange events.

### **6.8 Media Query Helpers**

Based on CSS and device breakpoints:

- `isSmall`, `isMedium`, `isLarge`
- custom queries via API

### **6.9 Observable State Layer**

Every detection result should be accessible as:

- **a synchronous getter**, and
- **a reactive/observable stream**

This ensures compatibility with both imperative and reactive UI frameworks.

---

## **7. Architecture & Integration**

### **7.1 Suggested Dependency**

- **@web-loom/platform-core**

Module will be implemented as:

- A wrapper around core utilities from `platform-core`
- Additional feature + capability detection logic

### **7.2 API Sketch**

```ts
import { platform } from '@web-loom/platform-core';

const device = platform.deviceType(); // 'mobile' | 'tablet' | 'desktop'
const os = platform.os(); // 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux'
const browser = platform.browser(); // 'Chrome' | 'Safari' ...

const features = platform.features(); // { touch: boolean, webgl: boolean, ... }

const network = platform.networkStatus.subscribe(...);

const battery = platform.batteryStatus.subscribe(...);

const viewport = platform.viewportSize.subscribe(...);

const orientation = platform.orientation.subscribe(...);

const media = platform.mediaQuery('(min-width: 600px)');
```

---

## **8. Requirements**

### **Functional Requirements**

| ID   | Requirement                                              | Priority |
| ---- | -------------------------------------------------------- | -------- |
| FR1  | Detect device type accurately                            | P0       |
| FR2  | Detect OS/platform                                       | P0       |
| FR3  | Detect browser type                                      | P0       |
| FR4  | Detect presence of major features (touch, WebGL, geo...) | P0       |
| FR5  | Provide online/offline state updates                     | P0       |
| FR6  | Provide battery state updates                            | P1       |
| FR7  | Provide viewport and orientation observables             | P0       |
| FR8  | Provide media query helpers                              | P1       |
| FR9  | Provide reactive streams for all state values            | P0       |
| FR10 | Provide fallback behavior for unsupported APIs           | P0       |

### **Non-Functional Requirements**

| Requirement   | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| Performance   | Must not add more than 5–10ms init overhead                        |
| Bundle size   | < 8 KB gzip ideally                                                |
| Compatibility | Must work on all major browsers (Edge 18+, iOS 12+, Android 8+)    |
| Reliability   | Must not break when UA string is removed (future UA-CH compliance) |

---

## **9. User Stories**

### **As a developer**

1. _I want to detect whether a user is on mobile or desktop_ so I can load an optimized layout.
2. _I want to detect browser capabilities_ so I can disable unsupported features.
3. _I want to monitor network speed_ so I can adjust image/video quality.
4. _I want to react to viewport changes_ so UI automatically adapts.
5. _I want access to battery data_ so I avoid power-heavy features when battery is low.

---

## **10. Open Questions**

- Should GPU-level capability detection (Renderer/WebGL info) be included?
- Should there be built-in support for detecting low-power mode?
- Should platform-core be extended or overridden?

---

## **11. Appendices**

### **Reference: Suggested Package**

- **@web-loom/platform-core**
  Recommended for baseline detection logic, observables, and platform abstractions.

---
