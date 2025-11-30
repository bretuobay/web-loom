import { detectDeviceType } from './detectors/device';
import { detectPlatform } from './detectors/platform';
import { detectBrowser } from './detectors/browser';
import { detectFeatures } from './detectors/features';
import { networkObservable } from './observables/network';
import { batteryObservable } from './observables/battery';
import { viewportObservable } from './observables/viewport';
import type { DeviceType, Platform, Browser, FeatureCapabilities, PlatformInfo } from './types';

/**
 * Main Platform Detection API
 */
export class PlatformDetector {
  private _deviceType: DeviceType;
  private _platform: Platform;
  private _browser: Browser;
  private _features: FeatureCapabilities;

  constructor() {
    this._deviceType = detectDeviceType();
    this._platform = detectPlatform();
    this._browser = detectBrowser();
    this._features = detectFeatures();
  }

  /**
   * Get device type (mobile, tablet, desktop)
   */
  deviceType(): DeviceType {
    return this._deviceType;
  }

  /**
   * Get operating system/platform
   */
  os(): Platform {
    return this._platform;
  }

  /**
   * Get browser type
   */
  browser(): Browser {
    return this._browser;
  }

  /**
   * Get feature capabilities
   */
  features(): FeatureCapabilities {
    return this._features;
  }

  /**
   * Get complete platform info
   */
  info(): PlatformInfo {
    return {
      deviceType: this._deviceType,
      platform: this._platform,
      browser: this._browser,
      features: this._features,
    };
  }

  /**
   * Network status observable
   */
  get networkStatus() {
    return networkObservable;
  }

  /**
   * Battery status observable
   */
  get batteryStatus() {
    return batteryObservable;
  }

  /**
   * Viewport size and orientation observables
   */
  get viewport() {
    return viewportObservable;
  }

  /**
   * Create a media query observable
   */
  mediaQuery(query: string) {
    return viewportObservable.mediaQuery(query);
  }

  /**
   * Convenience getters for common checks
   */
  get isMobile(): boolean {
    return this._deviceType === 'mobile';
  }

  get isTablet(): boolean {
    return this._deviceType === 'tablet';
  }

  get isDesktop(): boolean {
    return this._deviceType === 'desktop';
  }

  get isIOS(): boolean {
    return this._platform === 'iOS';
  }

  get isAndroid(): boolean {
    return this._platform === 'Android';
  }

  get isTouchDevice(): boolean {
    return this._features.touch;
  }
}

export const platform = new PlatformDetector();
