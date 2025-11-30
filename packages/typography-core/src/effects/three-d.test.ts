import { describe, expect, it, vi } from 'vitest';
import { animate3DText, apply3DTextEffect } from './three-d';

describe('3D text effects', () => {
  it('applies 3d transforms to text elements', () => {
    const element = document.createElement('div');
    const controller = apply3DTextEffect(element, { depth: 24 });
    expect(element.style.transform).toContain('rotateX');
    controller.update({ rotateX: 20 });
    controller.destroy();
  });

  it('animates 3d text when browser APIs are present', async () => {
    const element = document.createElement('div');
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
    const controller = animate3DText(element, { iterations: 1 });
    controller.play();
    await controller.finished;
    expect(Element.prototype.animate).toHaveBeenCalled();
  });
});
