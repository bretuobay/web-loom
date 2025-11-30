import type { AnimationController, ThreeDEffectController, ThreeDEffectOptions } from '../types';

const defaultOptions: Required<Omit<ThreeDEffectOptions, 'highlightColor' | 'shadowColor'>> = {
  depth: 18,
  rotateX: 12,
  rotateY: -8,
  perspective: 800,
};

const defaultHighlight = 'rgba(255, 255, 255, 0.3)';
const defaultShadow = 'rgba(0, 0, 0, 0.35)';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export function apply3DTextEffect(element: HTMLElement, options: ThreeDEffectOptions = {}): ThreeDEffectController {
  if (!element) {
    throw new Error('apply3DTextEffect: element is required.');
  }

  const config = { ...defaultOptions, ...options };
  const highlight = options.highlightColor ?? defaultHighlight;
  const shadow = options.shadowColor ?? defaultShadow;

  const original = element.getAttribute('style') || '';
  element.style.setProperty('display', 'inline-block');
  element.style.setProperty('transform-style', 'preserve-3d');
  element.style.setProperty('perspective', `${config.perspective}px`);
  element.style.setProperty('text-shadow', `0 2px ${config.depth}px ${shadow}, 0 -1px 0 ${highlight}`);
  element.style.setProperty('transform', `rotateX(${config.rotateX}deg) rotateY(${config.rotateY}deg)`);

  return {
    update(nextOptions: Partial<ThreeDEffectOptions>) {
      const merged = { ...config, ...nextOptions };
      element.style.setProperty('perspective', `${merged.perspective ?? config.perspective}px`);
      element.style.setProperty(
        'transform',
        `rotateX(${merged.rotateX ?? config.rotateX}deg) rotateY(${merged.rotateY ?? config.rotateY}deg) translateZ(${merged.depth ?? config.depth}px)`,
      );
      if (nextOptions.highlightColor || nextOptions.shadowColor) {
        element.style.setProperty(
          'text-shadow',
          `0 2px ${merged.depth ?? config.depth}px ${nextOptions.shadowColor ?? shadow}, 0 -1px 0 ${nextOptions.highlightColor ?? highlight}`,
        );
      }
    },
    destroy() {
      element.setAttribute('style', original);
    },
  };
}

export function animate3DText(
  element: HTMLElement,
  options: ThreeDEffectOptions & { duration?: number; easing?: string; iterations?: number } = {},
): AnimationController {
  if (!element) {
    throw new Error('animate3DText: element is required.');
  }

  if (!isBrowser()) {
    throw new Error('animate3DText: requires a browser environment.');
  }

  const base = { ...defaultOptions, ...options };
  const keyframes: Keyframe[] = [
    { transform: `rotateX(${base.rotateX}deg) rotateY(${base.rotateY}deg) translateZ(${base.depth}px)` },
    { transform: `rotateX(${base.rotateX * -1}deg) rotateY(${base.rotateY * -1}deg) translateZ(${base.depth}px)` },
  ];

  const animation = element.animate(keyframes, {
    duration: options.duration ?? 1600,
    easing: options.easing ?? 'ease-in-out',
    iterations: options.iterations ?? Infinity,
    direction: 'alternate',
    fill: 'both',
  });

  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    reverse: () => animation.reverse(),
    cancel: () => animation.cancel(),
    finish: () => animation.finish(),
    get finished() {
      return animation.finished;
    },
  };
}
