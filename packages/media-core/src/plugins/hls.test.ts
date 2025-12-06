import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from '../player.js';
import { createHlsPlugin } from './hls.js';
import '../test-utils/media-stubs.js';

class FakeHlsInstance {
  static instances: FakeHlsInstance[] = [];
  attached: HTMLVideoElement | null = null;
  lastSource: string | null = null;
  destroyed = false;

  constructor() {
    FakeHlsInstance.instances.push(this);
  }

  attachMedia(element: HTMLVideoElement): void {
    this.attached = element;
  }

  loadSource(source: string): void {
    this.lastSource = source;
  }

  destroy(): void {
    this.destroyed = true;
  }

  static reset() {
    FakeHlsInstance.instances = [];
  }
}

describe('createHlsPlugin', () => {
  it('loads the provided library and attaches to the video element for HLS sources', async () => {
    FakeHlsInstance.reset();
    const loader = vi.fn().mockResolvedValue({ default: FakeHlsInstance });
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/stream.m3u8' }],
    });
    player.use(
      createHlsPlugin({
        loadLibrary: loader,
        preferNative: false,
      }),
    );

    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    // Wait for async plugin initialization to complete
    await vi.waitFor(() => {
      expect(FakeHlsInstance.instances).toHaveLength(1);
    });

    expect(loader).toHaveBeenCalledTimes(1);
    const instance = FakeHlsInstance.instances[0];
    expect(instance.attached).toBe(video);
    expect(instance.lastSource).toBe('/stream.m3u8');

    player.dispose();
    expect(instance.destroyed).toBe(true);
  });
});
