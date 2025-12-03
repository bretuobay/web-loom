import { beforeAll, afterAll, vi } from 'vitest';

const originalLoad = HTMLMediaElement.prototype.load;
const originalPlay = HTMLMediaElement.prototype.play;
const originalPause = HTMLMediaElement.prototype.pause;
const originalCanPlayType = HTMLMediaElement.prototype.canPlayType;
const originalIntersectionObserver = globalThis.IntersectionObserver;

export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  readonly options?: IntersectionObserverInit;
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  private observed = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    if (options?.root !== undefined) {
      (this as { root: Element | Document | null }).root = options.root;
    }
    if (options?.rootMargin) {
      (this as { rootMargin: string }).rootMargin = options.rootMargin;
    }
    if (options?.threshold !== undefined) {
      const thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold];
      (this as { thresholds: ReadonlyArray<number> }).thresholds = thresholds;
    }
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entry: Partial<IntersectionObserverEntry> = {}): void {
    const target = entry.target ?? this.observed.values().next().value ?? document.createElement('div');
    const payload: IntersectionObserverEntry = {
      time: entry.time ?? 0,
      target,
      isIntersecting: entry.isIntersecting ?? false,
      intersectionRatio: entry.intersectionRatio ?? (entry.isIntersecting ? 1 : 0),
      boundingClientRect: entry.boundingClientRect ?? ({} as DOMRectReadOnly),
      intersectionRect: entry.intersectionRect ?? ({} as DOMRectReadOnly),
      rootBounds: entry.rootBounds ?? null,
    };
    this.callback([payload], this);
  }

  static reset(): void {
    MockIntersectionObserver.instances = [];
  }
}

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', {
    configurable: true,
    value: vi.fn().mockReturnValue('probably'),
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver,
  });
});

afterAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: originalLoad,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: originalPlay,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: originalPause,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', {
    configurable: true,
    value: originalCanPlayType,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: originalIntersectionObserver,
  });
});
