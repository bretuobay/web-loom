import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from './player.js';
import './test-utils/media-stubs.js';

describe('MediaCorePlayer lifecycle hooks', () => {
  it('invokes mount, ready, and dispose hooks for image media', () => {
    const player = new MediaCorePlayer({
      kind: 'image',
      sources: [{ src: '/poster.png' }],
    });

    const mountSpy = vi.fn();
    const readySpy = vi.fn();
    const disposeSpy = vi.fn();

    player.onMount(({ element }) => mountSpy(element.tagName));
    player.onReady(readySpy);
    player.onDispose(disposeSpy);

    const container = document.createElement('div');
    player.mount(container);

    const image = container.querySelector('img');
    expect(image).toBeTruthy();

    image?.dispatchEvent(new Event('load'));

    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(mountSpy).toHaveBeenCalledWith('IMG');
    expect(readySpy).toHaveBeenCalledWith(expect.objectContaining({ state: 'ready' }));

    player.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('invokes playback lifecycle hooks for video media', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
    });

    const readySpy = vi.fn();
    const playSpy = vi.fn();
    const pauseSpy = vi.fn();
    const endSpy = vi.fn();

    player.onReady(readySpy);
    player.onPlay(playSpy);
    player.onPause(pauseSpy);
    player.onEnd(endSpy);

    const container = document.createElement('div');
    player.mount(container);

    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    video?.dispatchEvent(new Event('loadedmetadata'));
    expect(readySpy).toHaveBeenCalled();

    video?.dispatchEvent(new Event('play'));
    video?.dispatchEvent(new Event('pause'));
    video?.dispatchEvent(new Event('ended'));

    expect(playSpy).toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
    expect(endSpy).toHaveBeenCalled();
  });
});
