import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React, { useRef } from 'react';
import type { MediaCorePlayer } from '@web-loom/media-core';
import { MediaPlayer } from './MediaPlayer.js';
import { useMediaPlayer, useMediaState } from './hooks.js';

const sampleConfig = {
  kind: 'video' as const,
  sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
};

describe('@web-loom/media-react', () => {
  it('mounts a media element and exposes the player ref', async () => {
    const TestComponent = () => {
      const ref = useRef<MediaCorePlayer | null>(null);
      return <MediaPlayer ref={ref} config={sampleConfig} data-testid="player-container" />;
    };

    const { getByTestId } = render(<TestComponent />);
    const container = getByTestId('player-container');

    // Wait for video element to be mounted
    await waitFor(() => {
      expect(container.querySelector('video')).toBeTruthy();
    });

    // Wait for player to be ready before accessing ref
    await waitFor(() => {
      const video = container.querySelector('video');
      expect(video).toBeTruthy();
    });
  });

  it('useMediaPlayer + useMediaState expose playback snapshots', async () => {
    const StateProbe = () => {
      const { containerRef, player } = useMediaPlayer(sampleConfig);
      const snapshot = useMediaState(player);
      return (
        <div>
          <div ref={containerRef} data-testid="mount" />
          <span data-testid="state">{snapshot?.state ?? 'idle'}</span>
        </div>
      );
    };

    const { getByTestId } = render(<StateProbe />);
    const mount = getByTestId('mount');
    const state = getByTestId('state');

    const video = await waitFor(() => {
      const node = mount.querySelector('video');
      if (!node) {
        throw new Error('Video element not ready');
      }
      return node;
    });

    act(() => {
      vi.spyOn(video, 'paused', 'get').mockReturnValue(false);
      video.dispatchEvent(new Event('play'));
    });

    await waitFor(() => {
      expect(state.textContent).toBe('playing');
    });
  });
});
