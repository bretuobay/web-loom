import {
  defineComponent,
  h,
  mergeProps,
  toRef,
  watch,
  type PropType,
} from 'vue';
import type {
  MediaPlayerOptions,
  MediaPlugin,
  MediaSourceConfig,
  PlaybackSnapshot,
} from '@web-loom/media-core';
import { useMediaPlayer } from './useMediaPlayer.js';
import { useMediaState } from './useMediaState.js';

export const MediaPlayer = defineComponent({
  name: 'MediaPlayer',
  props: {
    config: {
      type: Object as PropType<MediaSourceConfig>,
      required: true,
    },
    options: {
      type: Object as PropType<MediaPlayerOptions>,
      default: undefined,
    },
    plugins: {
      type: Array as PropType<MediaPlugin[]>,
      default: () => [],
    },
    autoMount: {
      type: Boolean,
      default: true,
    },
    tag: {
      type: String,
      default: 'div',
    },
    class: {
      type: [String, Array, Object] as PropType<unknown>,
      default: undefined,
    },
  },
  emits: {
    ready: (_snapshot: PlaybackSnapshot) => true,
  },
  setup(props, { emit, expose, attrs, slots }) {
    const configRef = toRef(props, 'config');
    const optionsRef = toRef(props, 'options');
    const pluginsRef = toRef(props, 'plugins');

    const { containerRef, player } = useMediaPlayer(configRef, optionsRef, {
      autoMount: props.autoMount,
      plugins: pluginsRef,
    });
    const snapshot = useMediaState(player);

    watch(
      snapshot,
      (value) => {
        if (value?.state === 'ready') {
          emit('ready', value);
        }
      },
      { deep: true },
    );

    expose({ player });

    return () =>
      h(
        props.tag,
        mergeProps(attrs, {
          ref: containerRef,
          class: props.class,
          'data-media-player-kind': props.config.kind,
        }),
        slots.default ? slots.default() : undefined,
      );
  },
});
