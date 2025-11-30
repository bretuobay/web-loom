/**
 * Event handling helpers
 */
export class EventHelpers {
  /**
   * Add event listener and return cleanup function
   */
  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): () => void {
    element.addEventListener(type, listener as EventListener, options);

    return () => {
      element.removeEventListener(type, listener as EventListener, options);
    };
  }

  /**
   * Add event listener with delegation
   */
  static addDelegatedEventListener<K extends keyof HTMLElementEventMap>(
    container: HTMLElement | Document,
    selector: string,
    type: K,
    listener: (event: HTMLElementEventMap[K], target: HTMLElement) => void,
    options?: boolean | AddEventListenerOptions,
  ): () => void {
    const delegatedListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const delegateTarget = target.closest(selector) as HTMLElement;

      if (delegateTarget && container.contains(delegateTarget)) {
        listener(event as HTMLElementEventMap[K], delegateTarget);
      }
    };

    container.addEventListener(type, delegatedListener, options);

    return () => {
      container.removeEventListener(type, delegatedListener, options);
    };
  }

  /**
   * Debounce function execution
   */
  static debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function execution
   */
  static throttle<T extends (...args: unknown[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;

        setTimeout(() => {
          inThrottle = false;
        }, delay);
      }
    };
  }

  /**
   * Create custom event
   */
  static createCustomEvent(type: string, detail?: unknown, options?: EventInit): CustomEvent {
    return new CustomEvent(type, {
      detail,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  }

  /**
   * Dispatch custom event on element
   */
  static dispatchCustomEvent(element: HTMLElement, type: string, detail?: unknown, options?: EventInit): boolean {
    const event = this.createCustomEvent(type, detail, options);
    return element.dispatchEvent(event);
  }

  /**
   * Prevent event default and stop propagation
   */
  static preventDefault(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Check if event is from keyboard
   */
  static isKeyboardEvent(event: Event): event is KeyboardEvent {
    return event instanceof KeyboardEvent;
  }

  /**
   * Check if event is from mouse
   */
  static isMouseEvent(event: Event): event is MouseEvent {
    return event instanceof MouseEvent;
  }

  /**
   * Get event coordinates
   */
  static getEventCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    }

    if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      return { x: touch.clientX, y: touch.clientY };
    }

    return { x: 0, y: 0 };
  }

  /**
   * Wait for DOM content loaded
   */
  static onDOMContentLoaded(callback: () => void): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  /**
   * Wait for window load
   */
  static onWindowLoad(callback: () => void): void {
    if (document.readyState === 'complete') {
      callback();
    } else {
      window.addEventListener('load', callback, { once: true });
    }
  }
}
