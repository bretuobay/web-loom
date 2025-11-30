import type {
  FocusAssistController,
  FocusAssistOptions,
  GuidedReadingController,
  GuidedReadingOptions,
} from '../types';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export function createGuidedReading(element: HTMLElement, options: GuidedReadingOptions = {}): GuidedReadingController {
  if (!element) {
    throw new Error('createGuidedReading: element is required.');
  }

  const highlightClass = options.highlightClass ?? 'guided-reading-highlight';
  const interval = options.interval ?? 2500;
  const sentences = options.sentences ?? splitSentences(element.textContent || '');

  element.innerHTML = '';
  const spans = sentences.map((sentence) => {
    const span = document.createElement('span');
    span.textContent = sentence.trim() + ' ';
    span.className = 'guided-reading-chunk';
    element.appendChild(span);
    return span;
  });

  let index = 0;
  let timer: number | null = null;
  let active = false;

  const highlight = (targetIndex: number) => {
    spans.forEach((span, spanIndex) => {
      if (spanIndex === targetIndex) {
        span.classList.add(highlightClass);
        if (typeof span.scrollIntoView === 'function') {
          span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        span.classList.remove(highlightClass);
      }
    });
  };

  const tick = () => {
    highlight(index);
    index = index + 1 < spans.length ? index + 1 : options.loop ? 0 : index;
    if (!options.loop && index === spans.length - 1) {
      stop();
      return;
    }
    timer = window.setTimeout(tick, interval);
  };

  const start = () => {
    if (active) return;
    active = true;
    tick();
  };

  const pause = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    active = false;
  };

  const stop = () => {
    pause();
    index = 0;
    spans.forEach((span) => span.classList.remove(highlightClass));
  };

  return {
    start,
    pause,
    stop,
    next() {
      pause();
      index = Math.min(index + 1, spans.length - 1);
      highlight(index);
    },
    previous() {
      pause();
      index = Math.max(index - 1, 0);
      highlight(index);
    },
    isActive: () => active,
  };
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function createFocusAssist(element: HTMLElement, options: FocusAssistOptions = {}): FocusAssistController {
  if (!element) {
    throw new Error('createFocusAssist: element is required.');
  }

  if (!isBrowser()) {
    return {
      enable() {},
      disable() {},
      destroy() {},
      isEnabled: () => false,
    };
  }

  const highlight = document.createElement('div');
  highlight.style.position = 'absolute';
  highlight.style.left = '0';
  highlight.style.width = '100%';
  highlight.style.height = `${options.size ?? 28}px`;
  highlight.style.background = options.highlightColor ?? 'rgba(255, 255, 0, 0.2)';
  highlight.style.pointerEvents = 'none';
  highlight.style.opacity = '0';
  highlight.style.transition = 'opacity 200ms ease';
  highlight.style.zIndex = '1';

  const wrapper = document.createElement('div');
  const style = window.getComputedStyle(element);
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.width = style.width;
  wrapper.style.lineHeight = style.lineHeight;

  element.parentNode?.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  wrapper.appendChild(highlight);

  let enabled = false;

  const onMove = (event: MouseEvent) => {
    const bounds = wrapper.getBoundingClientRect();
    highlight.style.top = `${event.clientY - bounds.top - highlight.offsetHeight / 2}px`;
  };

  const enable = () => {
    if (enabled) return;
    enabled = true;
    highlight.style.opacity = String(options.opacity ?? 1);
    wrapper.addEventListener('mousemove', onMove);
  };

  const disable = () => {
    if (!enabled) return;
    enabled = false;
    highlight.style.opacity = '0';
    wrapper.removeEventListener('mousemove', onMove);
  };

  const destroy = () => {
    disable();
    wrapper.parentNode?.insertBefore(element, wrapper);
    wrapper.remove();
  };

  return {
    enable,
    disable,
    destroy,
    isEnabled: () => enabled,
  };
}
