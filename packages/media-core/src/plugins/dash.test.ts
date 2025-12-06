import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from '../player.js';
import { createDashPlugin, type DashPlayerInstance } from './dash.js';
import '../test-utils/media-stubs.js';

class FakeDashPlayer implements DashPlayerInstance {
  static instances: FakeDashPlayer[] = [];
  initialize = vi.fn();
  attachSource = vi.fn();
  reset = vi.fn();
  destroy = vi.fn();

  constructor() {
    FakeDashPlayer.instances.push(this);
  }
}

const fakeDashModule = {
  MediaPlayer() {
    return {
      create: () => new FakeDashPlayer(),
    };
  },
};

describe('createDashPlugin', () => {
  it('initializes dash.js when a DASH manifest is selected', async () => {
    FakeDashPlayer.instances = [];
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/manifest.mpd' }],
    });
    const loader = vi.fn().mockResolvedValue({ default: fakeDashModule });
    player.use(
      createDashPlugin({
        loadLibrary: loader,
        autoplay: false,
      }),
    );

    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    // Wait for async plugin initialization to complete
    await vi.waitFor(() => {
      expect(FakeDashPlayer.instances).toHaveLength(1);
    });

    expect(loader).toHaveBeenCalledTimes(1);
    const instance = FakeDashPlayer.instances[0];
    expect(instance.initialize).toHaveBeenCalledWith(video, '/manifest.mpd', false);

    await player.setSources([{ src: '/next.mpd' }]);
    // Wait for source change to process
    await vi.waitFor(() => {
      expect(instance.attachSource).toHaveBeenCalled();
    });
    expect(instance.attachSource).toHaveBeenCalledWith('/next.mpd');

    player.dispose();
    expect(instance.reset).toHaveBeenCalled();
  });
});
