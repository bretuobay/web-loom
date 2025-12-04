import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from '../player.js';
import { chapterMarkersPlugin } from './chapter-markers.js';
import '../test-utils/media-stubs.js';

describe('chapterMarkersPlugin', () => {
  it('renders chapters and responds to time updates and clicks', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
      chapters: [
        { id: 'intro', title: 'Intro', startTime: 0, endTime: 10 },
        { id: 'scene', title: 'Scene', startTime: 10, endTime: 20 },
      ],
    });
    player.use(chapterMarkersPlugin);
    const seekSpy = vi.spyOn(player, 'seekTo');

    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    const chapterContainer = container.querySelector('.media-core-chapters');
    expect(chapterContainer).toBeTruthy();
    const buttons = chapterContainer?.querySelectorAll('button[data-chapter-id]');
    expect(buttons?.length).toBe(2);

    (chapterContainer?.querySelector('[data-chapter-id="scene"]') as HTMLButtonElement)?.click();
    expect(seekSpy).toHaveBeenCalledWith(10);

    if (video) {
      Object.defineProperty(video, 'currentTime', {
        configurable: true,
        value: 12,
      });
    }
    video?.dispatchEvent(new Event('timeupdate'));
    const active = chapterContainer?.querySelector('button[data-active="true"]');
    expect(active?.dataset.chapterId).toBe('scene');
  });
});
