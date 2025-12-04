import type { MediaPlugin, MediaSource } from '../types.js';

export interface HlsInstance {
  attachMedia(element: HTMLVideoElement): void;
  loadSource(source: string): void;
  detachMedia?: () => void;
  destroy?: () => void;
}

export interface HlsConstructor {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported?: () => boolean;
}

export interface HlsPluginOptions {
  loadLibrary: () => Promise<{ default?: HlsConstructor } | HlsConstructor>;
  config?: Record<string, unknown>;
  preferNative?: boolean;
  [key: string]: unknown;
}

export function createHlsPlugin(options: HlsPluginOptions): MediaPlugin<HlsPluginOptions> {
  if (!options?.loadLibrary) {
    throw new Error('createHlsPlugin requires a loadLibrary option to dynamically import hls.js.');
  }

  return {
    name: 'hls',
    setup({ player, on }) {
      let video: HTMLVideoElement | null = null;
      let hlsInstance: HlsInstance | null = null;
      let libraryPromise: Promise<HlsConstructor> | null = null;

      const ensureLibrary = () => {
        if (!libraryPromise) {
          libraryPromise = options.loadLibrary().then((mod) => {
            if (typeof (mod as HlsConstructor).prototype === 'object') {
              return mod as HlsConstructor;
            }
            const maybeDefault = (mod as { default?: HlsConstructor }).default;
            if (!maybeDefault) {
              throw new Error('createHlsPlugin: loadLibrary() did not return a valid constructor.');
            }
            return maybeDefault;
          });
        }
        return libraryPromise;
      };

      const teardownInstance = () => {
        if (!hlsInstance) return;
        if (typeof hlsInstance.destroy === 'function') {
          hlsInstance.destroy();
        } else {
          hlsInstance.detachMedia?.();
        }
        hlsInstance = null;
      };

      const shouldUseNative = (): boolean => {
        if (!video) return false;
        if (options.preferNative === false) {
          return false;
        }
        const capability = video.canPlayType('application/vnd.apple.mpegurl');
        return capability === 'probably' || capability === 'maybe';
      };

      const handleSourceChange = async () => {
        if (!video || player.kind !== 'video') {
          teardownInstance();
          return;
        }
        const currentSource = player.getCurrentSource();
        if (!isHlsSource(currentSource)) {
          teardownInstance();
          return;
        }
        if (shouldUseNative()) {
          teardownInstance();
          return;
        }

        const Constructor = await ensureLibrary();
        if (typeof Constructor.isSupported === 'function' && !Constructor.isSupported()) {
          teardownInstance();
          return;
        }

        if (!hlsInstance) {
          hlsInstance = new Constructor(options.config);
          hlsInstance.attachMedia(video);
        }
        hlsInstance.loadSource(currentSource.src);
      };

      const mountDisposer = on('mount', ({ element }) => {
        if (element instanceof HTMLVideoElement) {
          if (video && video !== element) {
            teardownInstance();
          }
          video = element;
        } else {
          video = null;
          teardownInstance();
        }
        void handleSourceChange();
      });

      const sourceDisposer = on('sourcechange', () => {
        void handleSourceChange();
      });

      const disposeDisposer = on('dispose', () => {
        teardownInstance();
        video = null;
      });

      return () => {
        mountDisposer();
        sourceDisposer();
        disposeDisposer();
        teardownInstance();
      };
    },
  };
}

function isHlsSource(source: MediaSource | null): source is MediaSource {
  if (!source) return false;
  if (source.type && /application\/(vnd\.apple\.mpegurl|x-mpegurl)/i.test(source.type)) {
    return true;
  }
  return /\.m3u8($|\?)/i.test(source.src);
}
