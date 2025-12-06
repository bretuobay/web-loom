import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaCorePlayer } from '@web-loom/media-core';
import type {
  MediaEventMap,
  MediaPlayerOptions,
  MediaPlugin,
  MediaSourceConfig,
  PlaybackSnapshot,
} from '@web-loom/media-core';

export interface UseMediaPlayerOptions {
  /**
   * Automatically mount the underlying MediaCorePlayer into the provided container.
   * Defaults to true.
   */
  autoMount?: boolean;
  /**
   * Media plugins that should be registered with the player instance.
   */
  plugins?: MediaPlugin[];
}

export interface UseMediaPlayerResult {
  /**
   * Callback ref for the container element where the native media element should be mounted.
   */
  containerRef: (element: HTMLDivElement | null) => void;
  /**
   * The underlying MediaCorePlayer instance once created.
   */
  player: MediaCorePlayer | null;
}

const SNAPSHOT_EVENTS: Array<keyof MediaEventMap> = [
  'ready',
  'play',
  'pause',
  'timeupdate',
  'seeking',
  'seeked',
  'ended',
  'error',
];

export function useMediaPlayer(
  config: MediaSourceConfig,
  options?: MediaPlayerOptions,
  hookOptions: UseMediaPlayerOptions = {},
): UseMediaPlayerResult {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const playerRef = useRef<MediaCorePlayer | null>(null);
  const registeredPlugins = useRef<Set<string>>(new Set());
  const autoMount = hookOptions.autoMount !== false;
  const optionsKey = useSerializedValue(options);
  const configKey = useSerializedValue(config);

  const getPlayer = () => {
    if (!playerRef.current) {
      playerRef.current = new MediaCorePlayer(config, options ?? {});
    }
    return playerRef.current;
  };

  useEffect(() => {
    getPlayer().setMediaConfig(config);
  }, [configKey]);

  useEffect(() => {
    if (!autoMount) {
      return () => {
        playerRef.current?.dispose();
        playerRef.current = null;
      };
    }
    const player = getPlayer();
    if (!container) {
      return;
    }
    player.mount(container);
    registerPlugins(player, hookOptions.plugins, registeredPlugins.current);
    return () => {
      player.dispose();
      playerRef.current = null;
      registeredPlugins.current.clear();
    };
  }, [container, autoMount, hookOptions.plugins]);

  const initialOptionsKey = useRef(optionsKey);
  useEffect(() => {
    if (initialOptionsKey.current === optionsKey) {
      return;
    }
    initialOptionsKey.current = optionsKey;
    const containerEl = container;
    playerRef.current?.dispose();
    playerRef.current = new MediaCorePlayer(config, options ?? {});
    registeredPlugins.current.clear();
    if (autoMount && containerEl) {
      playerRef.current.mount(containerEl);
      registerPlugins(playerRef.current, hookOptions.plugins, registeredPlugins.current);
    }
  }, [optionsKey, autoMount, container, hookOptions.plugins]);

  useEffect(() => {
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
      registeredPlugins.current.clear();
    };
  }, []);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  return { containerRef, player: playerRef.current };
}

export function useMediaState(player: MediaCorePlayer | null | undefined): PlaybackSnapshot | null {
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(() => player?.getState() ?? null);

  useEffect(() => {
    if (!player) {
      setSnapshot(null);
      return;
    }
    setSnapshot(player.getState());
    const unsubs = SNAPSHOT_EVENTS.map((eventName) =>
      player.on(eventName, (state) => {
        if (state && typeof state === 'object' && 'state' in state) {
          setSnapshot(state as PlaybackSnapshot);
        }
      }),
    );
    return () => {
      unsubs.forEach((dispose) => dispose());
    };
  }, [player]);

  return snapshot;
}

function registerPlugins(
  player: MediaCorePlayer | null,
  plugins: MediaPlugin[] | undefined,
  registry: Set<string>,
): void {
  if (!player || !plugins?.length) {
    return;
  }
  for (const plugin of plugins) {
    if (registry.has(plugin.name)) continue;
    try {
      player.use(plugin);
      registry.add(plugin.name);
    } catch (error) {
      if (error instanceof Error && /has already been registered/i.test(error.message)) {
        continue;
      }
      // eslint-disable-next-line no-console
      console.warn(`@web-loom/media-react: Failed to register plugin "${plugin.name}":`, error);
    }
  }
}

function useSerializedValue(value: unknown): string {
  return useMemo(() => {
    if (value == null) return 'null';
    try {
      return JSON.stringify(value);
    } catch {
      return String(Math.random());
    }
  }, [value]);
}
