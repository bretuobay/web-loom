import type { MediaPlugin, MediaSource } from '../types.js';

export interface DashPlayerInstance {
  initialize(element: HTMLVideoElement, source: string, autoplay?: boolean): void;
  attachSource?: (source: string) => void;
  reset?: () => void;
  destroy?: () => void;
}

export interface DashLibraryModule {
  MediaPlayer(): {
    create(): DashPlayerInstance;
  };
}

export interface DashPluginOptions {
  loadLibrary: () => Promise<{ default?: DashLibraryModule } | DashLibraryModule>;
  autoplay?: boolean;
  configurePlayer?: (player: DashPlayerInstance) => void;
}

export function createDashPlugin(options: DashPluginOptions): MediaPlugin<DashPluginOptions> {
  if (!options?.loadLibrary) {
    throw new Error('createDashPlugin requires a loadLibrary option to dynamically import dash.js.');
  }

  return {
    name: 'dash',
    setup({ player, on }) {
      let video: HTMLVideoElement | null = null;
      let dashInstance: DashPlayerInstance | null = null;
      let libraryPromise: Promise<DashLibraryModule> | null = null;
      let initialized = false;

      const ensureLibrary = () => {
        if (!libraryPromise) {
          libraryPromise = options.loadLibrary().then((mod) => {
            if ('MediaPlayer' in (mod as DashLibraryModule)) {
              return mod as DashLibraryModule;
            }
            const maybeDefault = (mod as { default?: DashLibraryModule }).default;
            if (!maybeDefault) {
              throw new Error('createDashPlugin: loadLibrary() did not return a dash.js module.');
            }
            return maybeDefault;
          });
        }
        return libraryPromise;
      };

      const ensurePlayerInstance = async (): Promise<DashPlayerInstance> => {
        if (dashInstance) {
          return dashInstance;
        }
        const lib = await ensureLibrary();
        const factory = lib.MediaPlayer?.();
        if (!factory || typeof factory.create !== 'function') {
          throw new Error('createDashPlugin: MediaPlayer().create() is not available on the loaded library.');
        }
        dashInstance = factory.create();
        options.configurePlayer?.(dashInstance);
        initialized = false;
        return dashInstance;
      };

      const resetInstance = () => {
        if (!dashInstance) return;
        if (typeof dashInstance.reset === 'function') {
          dashInstance.reset();
        } else {
          dashInstance.destroy?.();
        }
        dashInstance = null;
        initialized = false;
      };

      const handleSourceChange = async () => {
        if (!video || player.kind !== 'video') {
          resetInstance();
          return;
        }
        const source = player.getCurrentSource();
        if (!isDashSource(source)) {
          resetInstance();
          return;
        }
        const instance = await ensurePlayerInstance();
        if (!initialized) {
          instance.initialize(video, source.src, options.autoplay ?? false);
          initialized = true;
          return;
        }
        if (typeof instance.attachSource === 'function') {
          instance.attachSource(source.src);
        } else {
          instance.initialize(video, source.src, options.autoplay ?? false);
        }
      };

      const mountDisposer = on('mount', ({ element }) => {
        if (element instanceof HTMLVideoElement) {
          if (video && video !== element) {
            resetInstance();
          }
          video = element;
        } else {
          video = null;
          resetInstance();
        }
        void handleSourceChange();
      });

      const sourceDisposer = on('sourcechange', () => {
        void handleSourceChange();
      });

      const disposeDisposer = on('dispose', () => {
        resetInstance();
        video = null;
      });

      return () => {
        mountDisposer();
        sourceDisposer();
        disposeDisposer();
        resetInstance();
      };
    },
  };
}

function isDashSource(source: MediaSource | null): source is MediaSource {
  if (!source) return false;
  if (source.type && /(application|video)\/dash\+xml/i.test(source.type)) {
    return true;
  }
  return /\.mpd($|\?)/i.test(source.src);
}
