import { beforeEach, describe, expect, it, vi } from 'vitest';
import { animateVariableFont, createSpeedReading, morphText } from './advanced';

describe('advanced animations', () => {
  beforeEach(() => {
    const animationMock = {
      play: vi.fn(),
      pause: vi.fn(),
      reverse: vi.fn(),
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve({} as Animation),
      addEventListener: vi.fn(),
    } as unknown as Animation;

    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(Element.prototype, 'animate', {
        configurable: true,
        value: vi.fn(() => animationMock),
      });
    } else {
      (Element.prototype as any).animate = vi.fn(() => animationMock);
    }
  });

  it('morphs text between two values', async () => {
    const element = document.createElement('div');
    const controller = morphText(element, 'Read', 'Morph');
    controller.play();
    await controller.finished;
    expect(element.textContent?.trim()).toBe('Morph');
  });

  it('creates a speed reading controller', () => {
    vi.useFakeTimers();
    const element = document.createElement('div');
    const controller = createSpeedReading('Speed reading improves focus', {
      wordsPerMinute: 600,
      chunkSize: 2,
      target: element,
    });
    expect(controller.isRunning()).toBe(true);
    vi.advanceTimersByTime(200);
    controller.pause();
    expect(controller.isRunning()).toBe(false);
    controller.stop();
    vi.useRealTimers();
  });

  it('animates variable font axes', async () => {
    const element = document.createElement('div');
    const controller = animateVariableFont(element, [
      { settings: { wght: 400 } },
      { settings: { wght: 700, wdth: 110 }, duration: 400 },
    ]);
    controller.play();
    await controller.finished;
    expect(Element.prototype.animate).toHaveBeenCalled();
  });
});
