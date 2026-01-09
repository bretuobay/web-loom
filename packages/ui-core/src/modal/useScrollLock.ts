import { useEffect } from 'react';

let scrollLockCount = 0;
let initialOverflow: string | null = null;

function lockScroll() {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  if (scrollLockCount === 0) {
    initialOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  scrollLockCount += 1;
}

function unlockScroll() {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount === 0 && initialOverflow !== null) {
    document.body.style.overflow = initialOverflow;
    initialOverflow = null;
  }
}

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) {
      return () => undefined;
    }

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [active]);
}
