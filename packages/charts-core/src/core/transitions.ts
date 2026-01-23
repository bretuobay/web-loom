/**
 * Transition utilities for smooth animations
 * Provides consistent timing and easing across all chart animations
 */

/**
 * Transition utilities for smooth animations
 * Provides consistent timing and easing across all chart animations
 */

import type { Selection } from 'd3-selection';

/**
 * Default transition configuration
 * Duration: 300ms
 * Easing: cubic-bezier(0.4, 0, 0.2, 1) - Material Design standard easing
 */
export const TRANSITION_CONFIG = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Creates a D3 transition with standard timing
 * @param selection - D3 selection to apply transition to
 * @param duration - Optional custom duration (defaults to 300ms)
 * @returns D3 transition
 */
export function createTransition<GElement extends Element, Datum>(
  selection: Selection<GElement, Datum, any, any>,
  duration: number = TRANSITION_CONFIG.duration
) {
  // D3 selection has transition() method available at runtime
  // We use 'any' to bypass TypeScript checking since the types don't include it
  return (selection as any)
    .transition()
    .duration(duration)
    .ease((t: number) => {
      // cubic-bezier(0.4, 0, 0.2, 1) implementation
      // This is the Material Design standard easing curve
      const c1 = 0.4;
      const c3 = 0.2;
      const c4 = 1.0;
      
      if (t === 0 || t === 1) return t;
      
      // Cubic bezier approximation
      const t2 = t * t;
      const t3 = t2 * t;
      
      return 3 * c1 * (1 - t) * (1 - t) * t +
             3 * c3 * (1 - t) * t2 +
             c4 * t3;
    });
}

/**
 * Applies a CSS transition to an element
 * @param element - HTML element to apply transition to
 * @param properties - CSS properties to transition
 * @param duration - Optional custom duration (defaults to 300ms)
 */
export function applyCSSTransition(
  element: HTMLElement,
  properties: string[] = ['all'],
  duration: number = TRANSITION_CONFIG.duration
): void {
  const transitionValue = properties
    .map(prop => `${prop} ${duration}ms ${TRANSITION_CONFIG.easing}`)
    .join(', ');
  
  element.style.transition = transitionValue;
}

/**
 * Removes CSS transition from an element
 * @param element - HTML element to remove transition from
 */
export function removeCSSTransition(element: HTMLElement): void {
  element.style.transition = 'none';
}

/**
 * Animates a numeric value change
 * @param from - Starting value
 * @param to - Ending value
 * @param duration - Animation duration in ms
 * @param onUpdate - Callback called with interpolated value
 * @param onComplete - Optional callback when animation completes
 * @returns Function to cancel the animation
 */
export function animateValue(
  from: number,
  to: number,
  duration: number = TRANSITION_CONFIG.duration,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  const startTime = performance.now();
  let animationFrame: number;
  let cancelled = false;

  const animate = (currentTime: number) => {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply easing
    const easedProgress = easeInOutCubic(progress);
    const currentValue = from + (to - from) * easedProgress;
    
    onUpdate(currentValue);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  animationFrame = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    cancelled = true;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
}

/**
 * Cubic ease-in-out function matching cubic-bezier(0.4, 0, 0.2, 1)
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
function easeInOutCubic(t: number): number {
  if (t === 0 || t === 1) return t;
  
  const c1 = 0.4;
  const c3 = 0.2;
  const c4 = 1.0;
  
  const t2 = t * t;
  const t3 = t2 * t;
  
  return 3 * c1 * (1 - t) * (1 - t) * t +
         3 * c3 * (1 - t) * t2 +
         c4 * t3;
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttles a function call
 * @param func - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: any = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== null) {
          func.apply(lastContext, lastArgs);
          lastArgs = null;
          lastContext = null;
        }
      }, limit);
    } else {
      lastArgs = args;
      lastContext = context;
    }
  };
}
