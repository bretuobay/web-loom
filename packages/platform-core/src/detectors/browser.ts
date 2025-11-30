import type { Browser } from '../types';

/**
 * Detect browser type
 */
export function detectBrowser(): Browser {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent;

  // Check for WebView environments
  if (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua)) {
    return 'WebView';
  }

  if (/wv|WebView|Android.*Version\/[\d.]+.*Chrome/i.test(ua)) {
    return 'WebView';
  }

  // Edge (Chromium-based)
  if (/Edg/.test(ua)) {
    return 'Edge';
  }

  // Opera
  if (/OPR|Opera/.test(ua)) {
    return 'Opera';
  }

  // Chrome
  if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) {
    return 'Chrome';
  }

  // Safari
  if (/Safari/.test(ua) && !/Chrome|Edg|OPR/.test(ua)) {
    return 'Safari';
  }

  // Firefox
  if (/Firefox/.test(ua)) {
    return 'Firefox';
  }

  return 'Unknown';
}
