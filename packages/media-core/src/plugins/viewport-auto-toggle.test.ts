import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from '../player.js';
import { viewportAutoTogglePlugin } from './viewport-auto-toggle.js';
import { MockIntersectionObserver } from '../test-utils/media-stubs.js';

describe('viewportAutoTogglePlugin', () => {
  it('plays when entering viewport and pauses when leaving', () => {
    MockIntersectionObserver.reset();
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/auto.mp4', type: 'video/mp4' }],
    });
    const playSpy = vi.spyOn(player, 'play');
    const pauseSpy = vi.spyOn(player, 'pause');
    player.use(viewportAutoTogglePlugin);

    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    const observer = MockIntersectionObserver.instances[0];
    observer.trigger({ isIntersecting: true, target: video ?? undefined });
    expect(playSpy).toHaveBeenCalled();

    observer.trigger({ isIntersecting: false, target: video ?? undefined });
    expect(pauseSpy).toHaveBeenCalled();
  });
});
