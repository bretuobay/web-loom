import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from './player.js';
import type { MediaPlugin } from './types.js';

describe('MediaCorePlayer plugins', () => {
  it('runs plugin setup with context accessors and options', () => {
    const pluginSetup = vi.fn();
    const plugin: MediaPlugin<{ label: string }> = {
      name: 'test-plugin',
      setup: pluginSetup,
    };

    const player = new MediaCorePlayer(
      {
        kind: 'video',
        sources: [{ src: '/video.mp4', type: 'video/mp4' }],
      },
      { controls: true },
    );

    player.use(plugin, { label: 'demo' });

    expect(pluginSetup).toHaveBeenCalledTimes(1);
    const context = pluginSetup.mock.calls[0][0];
    expect(context.player).toBe(player);
    expect(context.options).toEqual({ label: 'demo' });
    expect(context.getMediaConfig()).toMatchObject({ kind: 'video' });
    expect(context.getPlayerOptions()).toMatchObject({ controls: true });
  });

  it('allows plugins to subscribe to events through the provided context', () => {
    const readySpy = vi.fn();
    const plugin: MediaPlugin = {
      name: 'listener-plugin',
      setup({ on }) {
        const unsubscribe = on('ready', readySpy);
        return () => unsubscribe();
      },
    };

    const player = new MediaCorePlayer({
      kind: 'image',
      sources: [{ src: '/poster.png' }],
    });

    player.use(plugin);

    const container = document.createElement('div');
    player.mount(container);
    const img = container.querySelector('img');
    img?.dispatchEvent(new Event('load'));

    expect(readySpy).toHaveBeenCalled();

    player.dispose();
    expect(readySpy).toHaveBeenCalledTimes(1);
  });

  it('throws when attempting to register the same plugin twice', () => {
    const plugin: MediaPlugin = {
      name: 'duplicate',
      setup() {},
    };
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/video.mp4', type: 'video/mp4' }],
    });
    player.use(plugin);
    expect(() => player.use(plugin)).toThrow(/already been registered/);
  });
});
