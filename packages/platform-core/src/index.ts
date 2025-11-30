/**
 * @web-loom/platform-core
 * Device & Platform Detection Library
 */

export { platform, PlatformDetector } from './platform';
export { networkObservable, NetworkObservable } from './observables/network';
export { batteryObservable, BatteryObservable } from './observables/battery';
export { viewportObservable, ViewportObservable } from './observables/viewport';

export type {
  DeviceType,
  Platform,
  Browser,
  Orientation,
  NetworkType,
  FeatureCapabilities,
  NetworkStatus,
  BatteryStatus,
  ViewportSize,
  PlatformInfo,
} from './types';
