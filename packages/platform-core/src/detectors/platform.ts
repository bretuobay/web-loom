import type { Platform } from '../types';

/**
 * Detect operating system/platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent;
  const platform = (navigator as any).userAgentData?.platform || navigator.platform;

  if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'iOS';
  }

  if (/Android/.test(ua)) {
    return 'Android';
  }

  if (/Win/.test(platform)) {
    return 'Windows';
  }

  if (/Mac/.test(platform)) {
    return 'macOS';
  }

  if (/Linux/.test(platform)) {
    return 'Linux';
  }

  if (/CrOS/.test(ua)) {
    return 'ChromeOS';
  }

  return 'Unknown';
}
