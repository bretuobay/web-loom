import type {
  AnimationController,
  MorphOptions,
  SpeedReadingController,
  SpeedReadingOptions,
  VariationKeyframes,
  VariableFontAnimationOptions,
} from '../types';

const defaultMorphOptions: Required<Omit<MorphOptions, 'onComplete'>> = {
  duration: 900,
  delay: 0,
  easing: 'ease-in-out',
  stagger: 20,
};

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export function morphText(
  element: HTMLElement,
  fromText: string,
  toText: string,
  options: MorphOptions = {},
): AnimationController {
  if (!element) {
    throw new Error('morphText: element is required.');
  }

  const config = { ...defaultMorphOptions, ...options };
  const mergedOptions = { ...config, onComplete: options.onComplete ?? (() => {}) };
  const longest = Math.max(fromText.length, toText.length);
  const animations: Animation[] = [];

  element.innerHTML = '';

  const spans = Array.from({ length: longest }).map((_, index) => {
    const span = document.createElement('span');
    span.textContent = fromText[index] ?? '';
    span.style.display = 'inline-block';
    span.style.willChange = 'opacity, filter, transform';
    element.appendChild(span);
    return span;
  });

  spans.forEach((span, index) => {
    const startChar = fromText[index] ?? '';
    const endChar = toText[index] ?? '';
    const halfDuration = mergedOptions.duration / 2;

    if (startChar !== endChar) {
      setTimeout(
        () => {
          span.textContent = endChar;
        },
        mergedOptions.delay + index * mergedOptions.stagger + halfDuration,
      );
    }

    const animation = span.animate(
      [
        { opacity: startChar ? 1 : 0, filter: 'blur(0px)' },
        { opacity: 0.2, filter: 'blur(8px)', offset: 0.5 },
        { opacity: endChar ? 1 : 0, filter: 'blur(0px)' },
      ],
      {
        duration: mergedOptions.duration,
        delay: mergedOptions.delay + index * mergedOptions.stagger,
        easing: mergedOptions.easing,
        fill: 'forwards',
      },
    );

    animation.addEventListener('finish', () => {
      span.textContent = endChar;
    });
    if (animation.finished) {
      animation.finished
        .then(() => {
          span.textContent = endChar;
        })
        .catch(() => {
          /* no-op: settling promise is best effort */
        });
    }

    animations.push(animation);
  });

  const controller: AnimationController = {
    play() {
      animations.forEach((animation) => animation.play());
    },
    pause() {
      animations.forEach((animation) => animation.pause());
    },
    reverse() {
      animations.forEach((animation) => animation.reverse());
    },
    cancel() {
      animations.forEach((animation) => animation.cancel());
      element.textContent = toText;
    },
    finish() {
      animations.forEach((animation) => animation.finish());
    },
    get finished() {
      return Promise.all(animations.map((animation) => animation.finished)).then(() => animations[0]);
    },
  };

  animations[0]?.addEventListener('finish', mergedOptions.onComplete);

  return controller;
}

export function createSpeedReading(text: string, options: SpeedReadingOptions = {}): SpeedReadingController {
  if (!text) {
    throw new Error('createSpeedReading: text is required.');
  }

  const words = text.split(/\s+/).filter(Boolean);
  const config = {
    wordsPerMinute: options.wordsPerMinute ?? 250,
    chunkSize: Math.max(options.chunkSize ?? 1, 1),
    autoStart: options.autoStart ?? true,
    target: options.target ?? null,
    onWord: options.onWord ?? (() => {}),
    onComplete: options.onComplete ?? (() => {}),
  };

  let pointer = 0;
  let timer: number | null = null;
  let running = false;

  const emitChunk = () => {
    if (pointer >= words.length) {
      stop();
      config.onComplete();
      return;
    }

    const chunk = words.slice(pointer, pointer + config.chunkSize).join(' ');
    config.target && (config.target.textContent = chunk);
    config.onWord(chunk, pointer);
    pointer += config.chunkSize;
    timer = window.setTimeout(emitChunk, getInterval());
  };

  const getInterval = () => (60_000 / config.wordsPerMinute) * config.chunkSize;

  const start = () => {
    if (!isBrowser()) {
      config.onComplete();
      return;
    }
    if (running) return;
    running = true;
    emitChunk();
  };

  const pause = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    running = false;
  };

  const stop = () => {
    pause();
    pointer = 0;
    if (config.target) {
      config.target.textContent = '';
    }
  };

  const controller: SpeedReadingController = {
    start,
    pause,
    stop,
    isRunning: () => running,
    setWordsPerMinute(newWpm: number) {
      config.wordsPerMinute = Math.max(newWpm, 60);
      if (running) {
        pause();
        start();
      }
    },
  };

  if (config.autoStart) {
    start();
  }

  return controller;
}

const buildFontVariationSettings = (settings: Record<string, number>) =>
  Object.entries(settings)
    .map(([axis, value]) => `"${axis}" ${value}`)
    .join(', ');

export function animateVariableFont(
  element: HTMLElement,
  keyframes: VariationKeyframes[],
  options: VariableFontAnimationOptions = {},
): AnimationController {
  if (!element) {
    throw new Error('animateVariableFont: element is required.');
  }

  if (!keyframes.length) {
    throw new Error('animateVariableFont: at least one keyframe is required.');
  }

  const timing: KeyframeAnimationOptions = {
    duration: options.duration ?? 1200,
    easing: options.easing ?? 'ease-in-out',
    iterations: options.iterations ?? 1,
    direction: options.direction ?? 'normal',
    fill: 'forwards',
  };

  const resolvedDuration =
    typeof timing.duration === 'number'
      ? timing.duration
      : typeof timing.duration === 'string'
        ? Number.parseFloat(timing.duration)
        : 0;

  const waKeyframes = keyframes.map((frame) => {
    const offset =
      frame.duration && resolvedDuration > 0 ? Math.min(Math.max(frame.duration / resolvedDuration, 0), 1) : undefined;

    return {
      fontVariationSettings: buildFontVariationSettings(frame.settings),
      offset,
      easing: frame.easing,
    };
  });

  const animation = element.animate(waKeyframes, timing);

  const controller: AnimationController = {
    play: () => animation.play(),
    pause: () => animation.pause(),
    reverse: () => animation.reverse(),
    cancel: () => animation.cancel(),
    finish: () => animation.finish(),
    get finished() {
      return animation.finished;
    },
  };

  return controller;
}
