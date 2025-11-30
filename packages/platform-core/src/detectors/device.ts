import type { DeviceType } from '../types';

/**
 * Detect device type based on viewport and user agent
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();

  // Check user agent for mobile/tablet indicators
  const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTabletUA = /tablet|ipad|playbook|silk/i.test(ua);

  // Combine viewport size with UA hints
  if (isTabletUA || (width >= 768 && width < 1024 && isMobileUA)) {
    return 'tablet';
  }

  if (isMobileUA || width < 768) {
    return 'mobile';
  }

  return 'desktop';
}
