import { describe, it, expect } from 'vitest';
import { MediaCorePlayer } from '../player.js';
import { minimalControlsPlugin } from './minimal-controls.js';
import '../test-utils/media-stubs.js';

describe('minimalControlsPlugin', () => {
  it('renders controls and responds to playback events', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/video.mp4', type: 'video/mp4' }],
    });
    player.use(minimalControlsPlugin, { showTime: true });

    const container = document.createElement('div');
    player.mount(container);

    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    video?.dispatchEvent(new Event('loadedmetadata'));
    if (video) {
      Object.defineProperty(video, 'paused', {
        configurable: true,
        get: () => false,
      });
    }
    video?.dispatchEvent(new Event('play'));
    video?.dispatchEvent(new Event('timeupdate'));
    if (video) {
      Object.defineProperty(video, 'paused', {
        configurable: true,
        get: () => true,
      });
    }
    video?.dispatchEvent(new Event('pause'));

    const controls = container.querySelector('.media-core-controls');
    expect(controls).toBeTruthy();
    const playButton = controls?.querySelector('.media-core-play');
    expect(playButton?.textContent).toBeDefined();
    const timeLabel = controls?.querySelector('.media-core-time');
    const progress = controls?.querySelector('.media-core-progress');
    expect(progress).toBeTruthy();
  });

  it('cleans up DOM when player is disposed', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/video.mp4', type: 'video/mp4' }],
    });
    player.use(minimalControlsPlugin);
    const container = document.createElement('div');
    player.mount(container);
    const controlsBefore = container.querySelector('.media-core-controls');
    expect(controlsBefore).toBeTruthy();
    player.dispose();
    expect(container.querySelector('.media-core-controls')).toBeNull();
  });
});
