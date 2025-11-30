/**
 * Device & Platform Detection Types
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type Platform = 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'ChromeOS' | 'Unknown';

export type Browser = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'WebView' | 'Unknown';

export type Orientation = 'portrait' | 'landscape';

export type NetworkType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

export interface FeatureCapabilities {
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

export interface NetworkStatus {
  online: boolean;
  effectiveType?: NetworkType;
  downlink?: number;
  rtt?: number;
}

export interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

export interface ViewportSize {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface PlatformInfo {
  deviceType: DeviceType;
  platform: Platform;
  browser: Browser;
  features: FeatureCapabilities;
}
