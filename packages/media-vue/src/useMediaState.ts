import { watch, ref, type Ref } from 'vue';
import type { MediaCorePlayer, PlaybackSnapshot } from '@web-loom/media-core';
import { toReactiveRef, type MaybeRef } from './internal.js';

type SnapshotEvent = 'ready' | 'play' | 'pause' | 'timeupdate' | 'seeking' | 'seeked' | 'ended' | 'error';

const SNAPSHOT_EVENTS: SnapshotEvent[] = [
  'ready',
  'play',
  'pause',
  'timeupdate',
  'seeking',
  'seeked',
  'ended',
  'error',
];

export function useMediaState(playerRef: MaybeRef<MediaCorePlayer | null | undefined>): Ref<PlaybackSnapshot | null> {
  const snapshot = ref<PlaybackSnapshot | null>(null);
  const source = toReactiveRef(playerRef);

  watch(
    source,
    (player, _prev, onCleanup) => {
      if (!player) {
        snapshot.value = null;
        return;
      }
      snapshot.value = player.getState();
      const disposers = SNAPSHOT_EVENTS.map((event) =>
        player.on(event, (nextState) => {
          snapshot.value = nextState;
        }),
      );
      onCleanup(() => {
        disposers.forEach((dispose) => dispose());
      });
    },
    { immediate: true },
  );

  return snapshot;
}
