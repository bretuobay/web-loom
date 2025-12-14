import { useCallback, useEffect, useLayoutEffect, useRef, type MutableRefObject, type RefObject } from 'react';

const focusableSelectors = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
];

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));
  return nodes.filter((node) => !node.hasAttribute('disabled') && node.tabIndex >= 0);
}

function focusFirstElement(
  container: HTMLElement,
  initialFocusRef?: RefObject<HTMLElement> | MutableRefObject<HTMLElement | null>
) {
  const target = initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container;
  if (target && typeof target.focus === 'function') {
    target.focus({ preventScroll: true });
  }
}

export interface FocusTrapOptions {
  /**
   * Optional ref to the element that should receive focus first when the trap activates.
   */
  initialFocusRef?: RefObject<HTMLElement> | MutableRefObject<HTMLElement | null>;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement> | MutableRefObject<HTMLElement | null>,
  active = true,
  options?: FocusTrapOptions
) {
  const { initialFocusRef } = options ?? {};
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const focusable = getFocusableElements(container);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      }
    },
    [containerRef]
  );

  useIsomorphicLayoutEffect(() => {
    if (!active) {
      return;
    }

    const container = containerRef.current;
    if (!container || typeof window === 'undefined') {
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    focusFirstElement(container, initialFocusRef);
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus({ preventScroll: true });
    };
  }, [active, containerRef, handleKeyDown, initialFocusRef]);
}
