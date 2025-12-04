import { onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue';
import {
  MediaCorePlayer,
  type MediaPlayerOptions,
  type MediaPlugin,
  type MediaSourceConfig,
} from '@web-loom/media-core';
import { toReactiveRef, type MaybeRef } from './internal.js';

export interface UseMediaPlayerOptions {
  autoMount?: MaybeRef<boolean | undefined>;
  plugins?: MaybeRef<MediaPlugin[] | undefined>;
}

export interface UseMediaPlayerResult {
  containerRef: Ref<HTMLElement | null>;
  player: Ref<MediaCorePlayer | null>;
}

export function useMediaPlayer(
  config: MaybeRef<MediaSourceConfig>,
  options?: MaybeRef<MediaPlayerOptions | undefined>,
  hookOptions: UseMediaPlayerOptions = {},
): UseMediaPlayerResult {
  const containerRef = ref<HTMLElement | null>(null);
  const player = shallowRef<MediaCorePlayer | null>(null);
  const pluginRegistry = new Set<string>();

  const configRef = toReactiveRef(config);
  const optionsRef = toReactiveRef(options);
  const autoMountRef = toReactiveRef(hookOptions.autoMount ?? true);
  const pluginsRef = toReactiveRef<MediaPlugin[] | undefined>(hookOptions.plugins);

  const ensurePlayer = () => {
    if (!player.value) {
      player.value = new MediaCorePlayer(configRef.value, optionsRef.value ?? {});
    }
    return player.value;
  };

  const mountInstance = () => {
    if (!autoMountRef.value) return;
    const el = containerRef.value;
    if (!el) return;
    const instance = ensurePlayer();
    instance.mount(el);
    registerPlugins(instance, pluginsRef.value, pluginRegistry);
  };

  watch(
    [containerRef, autoMountRef],
    () => {
      if (!containerRef.value) {
        return;
      }
      mountInstance();
    },
    { immediate: true },
  );

  watch(
    configRef,
    (next) => {
      if (!player.value) return;
      player.value.setMediaConfig(next);
    },
    { deep: true },
  );

  watch(
    optionsRef,
    () => {
      if (!player.value) return;
      const element = containerRef.value;
      player.value.dispose();
      player.value = null;
      pluginRegistry.clear();
      if (element && autoMountRef.value) {
        mountInstance();
      }
    },
    { deep: true },
  );

  watch(
    pluginsRef,
    (plugins) => {
      if (!player.value) return;
      registerPlugins(player.value, plugins, pluginRegistry);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    player.value?.dispose();
    player.value = null;
    pluginRegistry.clear();
  });

  return { containerRef, player };
}
function registerPlugins(
  player: MediaCorePlayer,
  plugins: MediaPlugin[] | undefined,
  registry: Set<string>,
): void {
  if (!plugins?.length) return;
  for (const plugin of plugins) {
    if (registry.has(plugin.name)) continue;
    try {
      player.use(plugin);
      registry.add(plugin.name);
    } catch (error) {
      if (error instanceof Error && /already been registered/i.test(error.message)) {
        continue;
      }
      // eslint-disable-next-line no-console
      console.warn(`@web-loom/media-vue: Failed to register plugin "${plugin.name}"`, error);
    }
  }
}
