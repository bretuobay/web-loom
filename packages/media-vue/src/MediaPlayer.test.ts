import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import type { MediaPlugin } from '@web-loom/media-core';
import { MediaPlayer } from './MediaPlayer.js';
import { useMediaPlayer } from './useMediaPlayer.js';
import { useMediaState } from './useMediaState.js';

const sampleConfig = {
  kind: 'video' as const,
  sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
};

describe('@web-loom/media-vue', () => {
  it('renders a container and mounts a media element', async () => {
    const wrapper = mount(MediaPlayer, {
      props: { config: sampleConfig },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.element.querySelector('video')).toBeTruthy();
  });

  it('useMediaPlayer composable exposes the player and container refs', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { containerRef, player } = useMediaPlayer(sampleConfig);
        const snapshot = useMediaState(player);
        return { containerRef, snapshot };
      },
      template: `<div><div ref="containerRef" data-testid="mount"></div><span data-testid="state">{{ snapshot?.state ?? 'idle' }}</span></div>`,
    });

    const wrapper = mount(TestComponent);
    await wrapper.vm.$nextTick();
    const mountEl = wrapper.get('[data-testid="mount"]');

    await wrapper.vm.$nextTick();
    expect(mountEl.element.querySelector('video')).toBeTruthy();
    expect(wrapper.get('[data-testid="state"]').text()).toBe('idle');
  });

  it('registers plugins only once when provided', async () => {
    const plugin: MediaPlugin = {
      name: 'test-plugin',
      setup({ on }) {
        const dispose = on('play', () => undefined);
        return () => dispose();
      },
    };
    const wrapper = mount(MediaPlayer, {
      props: {
        config: sampleConfig,
        plugins: [plugin],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.element.querySelector('video')).toBeTruthy();
  });
});
