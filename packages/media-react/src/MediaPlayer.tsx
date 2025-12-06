import { forwardRef, useEffect, useImperativeHandle } from 'react';
import type {
  MediaCorePlayer,
  MediaPlayerOptions,
  MediaPlugin,
  MediaSourceConfig,
  PlaybackSnapshot,
} from '@web-loom/media-core';
import { useMediaPlayer, useMediaState, type UseMediaPlayerOptions } from './hooks.js';

export interface MediaPlayerProps {
  config: MediaSourceConfig;
  options?: MediaPlayerOptions;
  /**
   * Optional plugins to register when the player is created.
   */
  plugins?: MediaPlugin[];
  /**
   * Disable automatic mounting for custom render control.
   */
  autoMount?: boolean;
  className?: string;
  /**
   * Called whenever the player emits a ready snapshot.
   */
  onReady?: (snapshot: PlaybackSnapshot) => void;
  /**
   * Optional test id forwarded to the root container.
   */
  'data-testid'?: string;
}

export const MediaPlayer = forwardRef<MediaCorePlayer | null, MediaPlayerProps>(function MediaPlayer(
  { config, options, plugins, autoMount, className, onReady, 'data-testid': testId },
  ref,
) {
  const hookOptions: UseMediaPlayerOptions = { autoMount };
  if (plugins?.length) {
    hookOptions.plugins = plugins;
  }
  const { containerRef, player } = useMediaPlayer(config, options, hookOptions);
  const snapshot = useMediaState(player);

  useImperativeHandle(ref, () => player as any, [player]);

  useEffect(() => {
    if (snapshot?.state === 'ready') {
      onReady?.(snapshot);
    }
  }, [snapshot, onReady]);

  return <div ref={containerRef} className={className} data-testid={testId} data-media-player-kind={config.kind} />;
});
