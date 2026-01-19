import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  const [player, setPlayer] = useState<MediaCorePlayer | null>(() => {
    // Initialize player immediately if autoMount is false
    if (hookOptions.autoMount === false) {
      return new MediaCorePlayer(config, options ?? {});
    }
    return null;
  });
  const playerRef = useRef(player);
  const registeredPlugins = useRef<Set<string>>(new Set());
  const autoMount = hookOptions.autoMount !== false;
  const optionsKey = useSerializedValue(options);
  const configKey = useSerializedValue(config);
  const prevConfigKey = useRef(configKey);

  // Update player config when config changes
  useLayoutEffect(() => {
    if (playerRef.current && prevConfigKey.current !== configKey) {
      playerRef.current.setMediaConfig(config);
      prevConfigKey.current = configKey;
    }
  }, [config, configKey]);

  // Create and mount player when container is available
  useLayoutEffect(() => {
    if (!autoMount || !container) {
      return;
    }

    // Create player if it doesn't exist
    if (!playerRef.current) {
      const newPlayer = new MediaCorePlayer(config, options ?? {});
      playerRef.current = newPlayer;
      setPlayer(newPlayer);
    }

    const currentPlayer = playerRef.current;
    const plugins = registeredPlugins.current;

    currentPlayer.mount(container);
    registerPlugins(currentPlayer, hookOptions.plugins, plugins);

    return () => {
      currentPlayer.dispose();
      playerRef.current = null;
      setPlayer(null);
      plugins.clear();
    };
  }, [container, autoMount, config, options, hookOptions.plugins, configKey, optionsKey]);

  // Recreate player when options change
  const prevOptionsKey = useRef(optionsKey);
  useLayoutEffect(() => {
    if (prevOptionsKey.current === optionsKey) {
      return;
    }
    prevOptionsKey.current = optionsKey;

    // Dispose old player
    if (playerRef.current) {
      playerRef.current.dispose();
    }

    // Create new player
    const newPlayer = new MediaCorePlayer(config, options ?? {});
    playerRef.current = newPlayer;
    setPlayer(newPlayer);
    registeredPlugins.current.clear();

    // Mount if needed
    if (autoMount && container) {
      newPlayer.mount(container);
      registerPlugins(newPlayer, hookOptions.plugins, registeredPlugins.current);
    }

    return () => {
      if (playerRef.current === newPlayer) {
        newPlayer.dispose();
        playerRef.current = null;
        setPlayer(null);
        registeredPlugins.current.clear();
      }
    };
  }, [optionsKey, config, options, autoMount, container, hookOptions.plugins]);

  // Final cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  return { containerRef, player };
}

export function useMediaState(player: MediaCorePlayer | null | undefined): PlaybackSnapshot | null {
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(() => player?.getState() ?? null);

  useLayoutEffect(() => {
    if (!player) {
      return;
    }

    // Subscribe to player events
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

  // When player changes, sync snapshot immediately
  useLayoutEffect(() => {
    if (player) {
      setSnapshot(player.getState());
    } else {
      setSnapshot(null);
    }
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
      console.warn(`@web-loom/media-react: Failed to register plugin "${plugin.name}":`, error);
    }
  }
}

let serializationFallbackCounter = 0;

function useSerializedValue(value: unknown): string {
  const fallbackIdRef = useRef<string | null>(null);

  return useMemo(() => {
    if (value == null) return 'null';
    try {
      return JSON.stringify(value);
    } catch {
      if (!fallbackIdRef.current) {
        fallbackIdRef.current = `non-serializable-${++serializationFallbackCounter}`;
      }
      return fallbackIdRef.current;
    }
  }, [value]);
}
