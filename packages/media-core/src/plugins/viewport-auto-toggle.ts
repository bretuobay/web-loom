import type { MediaPlugin } from '../types.js';

export interface ViewportAutoToggleOptions {
  /**
   * Automatically call player.play() when entering the viewport.
   * Defaults to true.
   */
  autoPlay?: boolean;
  /**
   * Automatically call player.pause() when leaving the viewport.
   * Defaults to true.
   */
  autoPause?: boolean;
  /**
   * IntersectionObserver threshold configuration.
   */
  threshold?: number | number[];
  /**
   * IntersectionObserver root margin.
   */
  rootMargin?: string;
  /**
   * IntersectionObserver root element.
   */
  root?: Element | Document | null;
}

export const viewportAutoTogglePlugin: MediaPlugin<ViewportAutoToggleOptions> = {
  name: 'viewport-auto-toggle',
  setup({ player, on, options }) {
    let observer: IntersectionObserver | null = null;
    const autoPlay = options?.autoPlay !== false;
    const autoPause = options?.autoPause !== false;

    const cleanupObserver = () => {
      observer?.disconnect();
      observer = null;
    };

    const handleEntry = (entry: IntersectionObserverEntry) => {
      if (!player.element || !(player.element instanceof HTMLMediaElement)) {
        return;
      }
      if (entry.isIntersecting) {
        if (autoPlay) {
          void player.play();
        }
        return;
      }
      if (autoPause) {
        player.pause();
      }
    };

    const mountDisposer = on('mount', ({ element }) => {
      cleanupObserver();
      if (!(element instanceof HTMLMediaElement)) {
        return;
      }
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          const latest = entries[entries.length - 1];
          if (latest) {
            handleEntry(latest);
          }
        },
        {
          root: options?.root ?? null,
          rootMargin: options?.rootMargin,
          threshold: options?.threshold ?? 0.25,
        },
      );
      observer.observe(element);
    });

    const disposeDisposer = on('dispose', () => {
      cleanupObserver();
    });

    return () => {
      cleanupObserver();
      mountDisposer();
      disposeDisposer();
    };
  },
};
