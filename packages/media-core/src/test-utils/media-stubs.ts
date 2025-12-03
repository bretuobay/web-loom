import { beforeAll, afterAll, vi } from 'vitest';

const originalLoad = HTMLMediaElement.prototype.load;
const originalPlay = HTMLMediaElement.prototype.play;
const originalPause = HTMLMediaElement.prototype.pause;
const originalCanPlayType = HTMLMediaElement.prototype.canPlayType;

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
});
