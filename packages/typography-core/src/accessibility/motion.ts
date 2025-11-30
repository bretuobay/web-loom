import type { AnimationConfig, SafeAnimationConfig } from './types';

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    console.warn('[respectMotionPreferences] Unable to read media query.', error);
    return true;
  }
};

export function respectMotionPreferences(animations: AnimationConfig[]): SafeAnimationConfig[] {
  const reduceMotion = prefersReducedMotion();

  return animations.map((animation) => {
    if (!reduceMotion) {
      return { ...animation, enabled: true, easing: animation.easing ?? 'ease' };
    }

    return {
      ...animation,
      enabled: false,
      duration: Math.min(animation.duration, 300),
      easing: 'linear',
    };
  });
}
