export type MediaKind = 'video' | 'audio' | 'image';

export interface MediaSource {
  src: string;
  /**
   * MIME type (e.g., video/mp4) so canPlayType can be evaluated.
   */
  type?: string;
  /**
   * Optional human-friendly label (e.g., "1080p", "English").
   */
  label?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  isDefault?: boolean;
  /**
   * Arbitrary metadata for plugins or analytics.
   */
  meta?: Record<string, unknown>;
}

export interface TextTrackConfig {
  id: string;
  kind: TextTrackKind;
  src: string;
  srclang?: string;
  label?: string;
  default?: boolean;
}

export interface ChapterMetadata {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  href?: string;
  description?: string;
}

export type PreviewThumbnailMap = Record<number | string, string>;

export interface MediaSourceConfig {
  kind: MediaKind;
  sources: MediaSource[];
  poster?: string;
  /**
   * Image-only alt text description.
   */
  alt?: string;
  tracks?: TextTrackConfig[];
  /**
   * Optional thumbnails or chapter metadata.
   */
  previewThumbnails?: PreviewThumbnailMap;
  chapters?: ChapterMetadata[];
}

export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'seeking'
  | 'ended'
  | 'error';

export interface PlaybackSnapshot {
  state: PlaybackState;
  currentTime: number;
  duration: number | null;
  buffered: TimeRanges | null;
  volume: number;
  muted: boolean;
  playbackRate: number;
  /**
   * Current active MediaSource, if any.
   */
  source?: MediaSource;
  /**
   * Media-specific measurements (e.g., natural size).
   */
  metrics?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
  error?: MediaError | DOMException | Error;
}

export interface MediaPlayerOptions {
  autoplay?: boolean | 'muted';
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  volume?: number;
  playbackRate?: number;
  aspectRatio?: number | string;
  responsive?: boolean;
  lazy?: boolean;
  preferNativeControls?: boolean;
  imageDecodeStrategy?: 'async' | 'sync';
  /**
   * Default text track ID if captions should start enabled.
   */
  defaultTextTrackId?: string;
  translations?: Record<string, string>;
}

export interface MediaEventMap {
  mount: { element: HTMLMediaElement | HTMLImageElement };
  ready: PlaybackSnapshot;
  play: PlaybackSnapshot;
  pause: PlaybackSnapshot;
  timeupdate: PlaybackSnapshot;
  seeking: PlaybackSnapshot;
  seeked: PlaybackSnapshot;
  ended: PlaybackSnapshot;
  loadedmetadata: PlaybackSnapshot;
  canplay: PlaybackSnapshot;
  ratechange: PlaybackSnapshot;
  volumechange: PlaybackSnapshot;
  sourcechange: { source: MediaSource | null };
  error: PlaybackSnapshot;
  trackchange: { kind: 'text' | 'audio'; id?: string };
  pictureinpictureenter: void;
  pictureinpictureleave: void;
  imageload: { naturalWidth: number; naturalHeight: number };
  imageerror: { error?: Error | DOMException };
  dispose: void;
}

export type MediaEventName = keyof MediaEventMap;

export type MediaEventHandler<E extends MediaEventName> = (
  payload: MediaEventMap[E]
) => void;

export interface MediaPlayer {
  readonly id: string;
  readonly kind: MediaKind;
  /**
   * Returns the underlying native element when mounted.
   */
  readonly element: HTMLMediaElement | HTMLImageElement | null;
  mount(target: HTMLElement | string): void;
  /**
   * Binds to an existing element created outside of the library.
   */
  attach(element: HTMLMediaElement | HTMLImageElement): void;
  dispose(): void;
  play(): Promise<void>;
  pause(): void;
  seekTo(seconds: number): void;
  reload(): void;
  /**
   * Attempts to decode the current image source when in image mode.
   * Resolves immediately for other media kinds.
   */
  decodeImage(): Promise<void>;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setPlaybackRate(rate: number): void;
  togglePlayPause(): Promise<void>;
  setMediaConfig(config: MediaSourceConfig): Promise<void>;
  setSources(sources: MediaSource[]): Promise<void>;
  setCaptionTrack(trackId: string | null): void;
  getCurrentSource(): MediaSource | null;
  getAvailableCaptionTracks(): TextTrackConfig[];
  getCurrentCaptionTrack(): TextTrackConfig | null;
  getState(): PlaybackSnapshot;
  getCurrentTime(): number;
  getDuration(): number | null;
  getVolume(): number;
  isMuted(): boolean;
  getPlaybackRate(): number;
  getBufferedRanges(): TimeRanges | null;
  getThumbnailForTime(timeInSeconds: number): string | null;
  getChapters(): ChapterMetadata[];
  enterPictureInPicture(): Promise<void>;
  exitPictureInPicture(): Promise<void>;
  isPictureInPictureSupported(): boolean;
  on<E extends MediaEventName>(event: E, handler: MediaEventHandler<E>): () => void;
  once<E extends MediaEventName>(event: E, handler: MediaEventHandler<E>): () => void;
  off<E extends MediaEventName>(event: E, handler: MediaEventHandler<E>): void;
  onMount(handler: MediaEventHandler<'mount'>): () => void;
  onReady(handler: MediaEventHandler<'ready'>): () => void;
  onPlay(handler: MediaEventHandler<'play'>): () => void;
  onPause(handler: MediaEventHandler<'pause'>): () => void;
  onEnd(handler: MediaEventHandler<'ended'>): () => void;
  onDispose(handler: MediaEventHandler<'dispose'>): () => void;
  use(plugin: MediaPlugin): void;
}

export type MediaPluginOptions = Record<string, unknown>;

export interface MediaPluginContext<TOptions extends MediaPluginOptions = MediaPluginOptions> {
  player: MediaPlayer;
  getMediaConfig(): Readonly<MediaSourceConfig>;
  getPlayerOptions(): Readonly<MediaPlayerOptions>;
  options: Readonly<TOptions>;
  on<E extends MediaEventName>(event: E, handler: MediaEventHandler<E>): () => void;
  once<E extends MediaEventName>(event: E, handler: MediaEventHandler<E>): () => void;
  off<E extends MediaEventName>(event: E, handler: MediaEventHandler<E>): void;
}

export interface MediaPlugin<TOptions extends MediaPluginOptions = MediaPluginOptions> {
  name: string;
  setup(context: MediaPluginContext<TOptions>): void | (() => void);
}
