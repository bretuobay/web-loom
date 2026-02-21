import { getCurrentEffect, setCurrentEffect } from './effect-context.js';

/**
 * Executes fn without collecting dependencies.
 * Any signal.get() inside fn will NOT be tracked by the outer computed/effect context.
 */
export function untracked<T>(fn: () => T): T {
  const saved = getCurrentEffect();
  setCurrentEffect(null);
  try {
    return fn();
  } finally {
    setCurrentEffect(saved);
  }
}
