# @web-loom/platform-core

Device & platform detection library with reactive observables for modern web applications.

## Features

- 🎯 **Device Type Detection** - Mobile, tablet, or desktop
- 💻 **Platform/OS Detection** - iOS, Android, Windows, macOS, Linux
- 🌐 **Browser Detection** - Chrome, Safari, Firefox, Edge, Opera, WebView
- ✨ **Feature Detection** - Touch, WebGL, geolocation, notifications, and more
- 📡 **Network Status** - Online/offline state, connection type, speed estimates
- 🔋 **Battery Status** - Battery level, charging state
- 📐 **Viewport Tracking** - Size, orientation, device pixel ratio
- 🎨 **Media Query Helpers** - Reactive media query matching
- 🔄 **Reactive Observables** - RxJS-powered state updates

## Installation

```bash
npm install @web-loom/platform-core
```

## Quick Start

```typescript
import { platform } from '@web-loom/platform-core';

// Synchronous detection
const device = platform.deviceType(); // 'mobile' | 'tablet' | 'desktop'
const os = platform.os(); // 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux'
const browser = platform.browser(); // 'Chrome' | 'Safari' | 'Firefox' | 'Edge' ...

// Feature capabilities
const features = platform.features();
console.log(features.touch); // boolean
console.log(features.webgl); // boolean
console.log(features.geolocation); // boolean

// Convenience getters
if (platform.isMobile) {
  console.log('Mobile device detected');
}

if (platform.isTouchDevice) {
  console.log('Touch support available');
}
```

## Reactive Observables

All dynamic states are exposed as RxJS observables:

### Network Status

```typescript
import { platform } from '@web-loom/platform-core';

platform.networkStatus.status$.subscribe(status => {
  console.log('Online:', status.online);
  console.log('Connection type:', status.effectiveType); // '4g' | '3g' | '2g' | 'slow-2g'
  console.log('Downlink speed:', status.downlink); // Mbps
  console.log('Round-trip time:', status.rtt); // ms
});

// Or just online/offline
platform.networkStatus.online$.subscribe(online => {
  console.log('Network is', online ? 'online' : 'offline');
});
```

### Battery Status

```typescript
platform.batteryStatus.status$.subscribe(battery => {
  if (battery) {
    console.log('Battery level:', battery.level * 100 + '%');
    console.log('Charging:', battery.charging);
    console.log('Time to full charge:', battery.chargingTime);
    console.log('Time to discharge:', battery.dischargingTime);
  }
});
```

### Viewport & Orientation

```typescript
// Viewport size
platform.viewport.size$.subscribe(size => {
  console.log('Width:', size.width);
  console.log('Height:', size.height);
  console.log('Device pixel ratio:', size.devicePixelRatio);
});

// Orientation
platform.viewport.orientation$.subscribe(orientation => {
  console.log('Orientation:', orientation); // 'portrait' | 'landscape'
});

// Individual dimensions
platform.viewport.width$.subscribe(width => {
  console.log('Viewport width:', width);
});
```

### Media Queries

```typescript
// Create reactive media query
const isLargeScreen$ = platform.mediaQuery('(min-width: 1024px)');

isLargeScreen$.subscribe(matches => {
  console.log('Large screen:', matches);
});

// Common breakpoints
const isMobileView$ = platform.mediaQuery('(max-width: 767px)');
const isTabletView$ = platform.mediaQuery('(min-width: 768px) and (max-width: 1023px)');
const isDesktopView$ = platform.mediaQuery('(min-width: 1024px)');
```

## Framework Integration

### React

```typescript
import { useEffect, useState } from 'react';
import { platform } from '@web-loom/platform-core';

function NetworkIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const subscription = platform.networkStatus.online$.subscribe(setOnline);
    return () => subscription.unsubscribe();
  }, []);

  return <div>{online ? '🟢 Online' : '🔴 Offline'}</div>;
}
```

### Angular

```typescript
import { Component } from '@angular/core';
import { platform } from '@web-loom/platform-core';

@Component({
  selector: 'app-network-indicator',
  template: `<div>{{ online$ | async ? '🟢 Online' : '🔴 Offline' }}</div>`
})
export class NetworkIndicatorComponent {
  online$ = platform.networkStatus.online$;
}
```

### Vue

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { platform } from '@web-loom/platform-core';

const online = ref(true);
let subscription;

onMounted(() => {
  subscription = platform.networkStatus.online$.subscribe(value => {
    online.value = value;
  });
});

onUnmounted(() => {
  subscription?.unsubscribe();
});
</script>

<template>
  <div>{{ online ? '🟢 Online' : '🔴 Offline' }}</div>
</template>
```

## API Reference

### Platform Detection

```typescript
platform.deviceType(): DeviceType // 'mobile' | 'tablet' | 'desktop'
platform.os(): Platform // 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'ChromeOS' | 'Unknown'
platform.browser(): Browser // 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'WebView' | 'Unknown'
platform.features(): FeatureCapabilities
platform.info(): PlatformInfo // Complete platform information
```

### Convenience Getters

```typescript
platform.isMobile: boolean
platform.isTablet: boolean
platform.isDesktop: boolean
platform.isIOS: boolean
platform.isAndroid: boolean
platform.isTouchDevice: boolean
```

### Feature Capabilities

```typescript
interface FeatureCapabilities {
  touch: boolean;
  geolocation: boolean;
  webgl: boolean;
  serviceWorker: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  deviceOrientation: boolean;
  notifications: boolean;
  permissions: boolean;
  mediaDevices: boolean;
}
```

### Observables

```typescript
platform.networkStatus.status$: Observable<NetworkStatus>
platform.networkStatus.online$: Observable<boolean>
platform.batteryStatus.status$: Observable<BatteryStatus | null>
platform.viewport.size$: Observable<ViewportSize>
platform.viewport.orientation$: Observable<Orientation>
platform.viewport.width$: Observable<number>
platform.viewport.height$: Observable<number>
platform.mediaQuery(query: string): Observable<boolean>
```

## Use Cases

### Responsive UI Logic

```typescript
// Adapt layout based on device
if (platform.isMobile) {
  // Show mobile navigation
} else {
  // Show desktop navigation
}

// React to viewport changes
platform.viewport.width$.subscribe(width => {
  if (width < 768) {
    // Apply mobile styles
  }
});
```

### Feature Gating

```typescript
const features = platform.features();

if (features.geolocation) {
  // Enable location-based features
}

if (features.webgl) {
  // Enable 3D graphics
} else {
  // Fallback to 2D rendering
}

if (features.notifications) {
  // Offer push notification subscription
}
```

### Performance Optimization

```typescript
// Adjust quality based on network
platform.networkStatus.status$.subscribe(network => {
  if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
    // Load low-quality images
  } else if (network.effectiveType === '4g') {
    // Load high-quality images
  }
});

// Reduce animations on low battery
platform.batteryStatus.status$.subscribe(battery => {
  if (battery && battery.level < 0.2 && !battery.charging) {
    // Disable heavy animations
  }
});
```

### Analytics & Segmentation

```typescript
const info = platform.info();

// Send to analytics
analytics.track('page_view', {
  device_type: info.deviceType,
  platform: info.platform,
  browser: info.browser,
  has_touch: info.features.touch,
  has_webgl: info.features.webgl,
});
```

## Browser Support

- Chrome/Edge 18+
- Safari 12+
- Firefox 60+
- iOS Safari 12+
- Android Chrome 80+

## Performance

- Bundle size: ~6 KB gzipped
- Initialization overhead: <5ms
- Zero dependencies (except RxJS)

## License

MIT

## Contributing

Contributions welcome! See the main Web Loom repository for guidelines.
