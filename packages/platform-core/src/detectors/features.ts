import type { FeatureCapabilities } from '../types';

/**
 * Detect browser feature capabilities
 */
export function detectFeatures(): FeatureCapabilities {
  if (typeof window === 'undefined') {
    return {
      touch: false,
      geolocation: false,
      webgl: false,
      serviceWorker: false,
      localStorage: false,
      indexedDB: false,
      deviceOrientation: false,
      notifications: false,
      permissions: false,
      mediaDevices: false,
    };
  }

  return {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    geolocation: 'geolocation' in navigator,
    webgl: detectWebGL(),
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: detectLocalStorage(),
    indexedDB: 'indexedDB' in window,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    notifications: 'Notification' in window,
    permissions: 'permissions' in navigator,
    mediaDevices: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
  };
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

function detectLocalStorage(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
