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
    let mutedState = false;
    let pausedState = true;

    const container = document.createElement('div');
    player.mount(container);

    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    if (video) {
      Object.defineProperty(video, 'duration', {
        configurable: true,
        value: 120,
      });
      Object.defineProperty(video, 'currentTime', {
        configurable: true,
        get: () => 30,
      });
      Object.defineProperty(video, 'muted', {
        configurable: true,
        get: () => mutedState,
        set: (value) => {
          mutedState = value;
        },
      });
      Object.defineProperty(video, 'paused', {
        configurable: true,
        get: () => pausedState,
      });
    }

    video?.dispatchEvent(new Event('loadedmetadata'));
    pausedState = false;
    video?.dispatchEvent(new Event('play'));
    video?.dispatchEvent(new Event('timeupdate'));
    pausedState = true;
    video?.dispatchEvent(new Event('pause'));

    const controls = container.querySelector('.media-core-controls');
    expect(controls).toBeTruthy();
    const playButton = controls?.querySelector('.media-core-play');
    expect(playButton?.textContent).toBeDefined();
    const progress = controls?.querySelector('.media-core-progress');
    expect(progress).toBeTruthy();
    const announcer = controls?.querySelector('[data-media-core-announcer]');
    expect(playButton?.getAttribute('aria-pressed')).toBe('false');

    pausedState = false;
    video?.dispatchEvent(new Event('play'));
    expect(playButton?.getAttribute('aria-pressed')).toBe('true');
    expect(announcer?.textContent).toBe('Playing');

    video?.dispatchEvent(new Event('timeupdate'));
    expect(progress?.getAttribute('aria-valuenow')).toBe('25');
    expect(progress?.getAttribute('aria-valuetext')).toBe('00:30 of 02:00 played');

    if (video) {
      mutedState = true;
    }
    video?.dispatchEvent(new Event('volumechange'));
    const muteButton = controls?.querySelector('.media-core-mute');
    expect(muteButton?.getAttribute('aria-pressed')).toBe('true');

    pausedState = true;
    video?.dispatchEvent(new Event('pause'));
    expect(playButton?.getAttribute('aria-pressed')).toBe('false');
    expect(announcer?.textContent).toBe('Paused');
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
