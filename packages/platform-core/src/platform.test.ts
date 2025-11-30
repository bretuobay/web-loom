import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformDetector } from './platform';

describe('PlatformDetector', () => {
  let platform: PlatformDetector;

  beforeEach(() => {
    // Mock matchMedia for tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    platform = new PlatformDetector();
  });

  it('should detect device type', () => {
    const deviceType = platform.deviceType();
    expect(['mobile', 'tablet', 'desktop']).toContain(deviceType);
  });

  it('should detect platform/OS', () => {
    const os = platform.os();
    expect(['iOS', 'Android', 'Windows', 'macOS', 'Linux', 'ChromeOS', 'Unknown']).toContain(os);
  });

  it('should detect browser', () => {
    const browser = platform.browser();
    expect(['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'WebView', 'Unknown']).toContain(browser);
  });

  it('should detect features', () => {
    const features = platform.features();
    expect(features).toHaveProperty('touch');
    expect(features).toHaveProperty('geolocation');
    expect(features).toHaveProperty('webgl');
    expect(features).toHaveProperty('serviceWorker');
    expect(features).toHaveProperty('localStorage');
    expect(features).toHaveProperty('indexedDB');
  });

  it('should provide complete platform info', () => {
    const info = platform.info();
    expect(info).toHaveProperty('deviceType');
    expect(info).toHaveProperty('platform');
    expect(info).toHaveProperty('browser');
    expect(info).toHaveProperty('features');
  });

  it('should have convenience getters', () => {
    expect(typeof platform.isMobile).toBe('boolean');
    expect(typeof platform.isTablet).toBe('boolean');
    expect(typeof platform.isDesktop).toBe('boolean');
    expect(typeof platform.isIOS).toBe('boolean');
    expect(typeof platform.isAndroid).toBe('boolean');
    expect(typeof platform.isTouchDevice).toBe('boolean');
  });

  it('should provide network status observable', () => {
    expect(platform.networkStatus).toBeDefined();
    expect(platform.networkStatus.status$).toBeDefined();
  });

  it('should provide battery status observable', () => {
    expect(platform.batteryStatus).toBeDefined();
    expect(platform.batteryStatus.status$).toBeDefined();
  });

  it('should provide viewport observable', () => {
    expect(platform.viewport).toBeDefined();
    expect(platform.viewport.size$).toBeDefined();
    expect(platform.viewport.orientation$).toBeDefined();
  });

  it('should create media query observable', () => {
    const mediaQuery$ = platform.mediaQuery('(min-width: 768px)');
    expect(mediaQuery$).toBeDefined();
  });
});
