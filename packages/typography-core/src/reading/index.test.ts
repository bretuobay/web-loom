import { describe, expect, it, vi } from 'vitest';
import { createFocusAssist, createGuidedReading } from './index';

describe('reading experience helpers', () => {
  it('creates guided reading controller', () => {
    vi.useFakeTimers();
    const element = document.createElement('div');
    element.textContent = 'Sentence one. Sentence two. Sentence three!';
    const controller = createGuidedReading(element, { interval: 100, loop: false });
    controller.start();
    vi.advanceTimersByTime(200);
    controller.pause();
    expect(controller.isActive()).toBe(false);
    controller.stop();
    vi.useRealTimers();
  });

  it('provides focus assistance overlay', () => {
    const container = document.createElement('div');
    container.style.width = '400px';
    container.style.lineHeight = '24px';
    document.body.appendChild(container);
    const assist = createFocusAssist(container, { highlightColor: 'rgba(0,0,0,0.1)' });
    assist.enable();
    expect(assist.isEnabled()).toBe(true);
    assist.disable();
    assist.destroy();
    document.body.removeChild(container);
  });
});
