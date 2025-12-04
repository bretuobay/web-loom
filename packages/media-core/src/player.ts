import type {
  ChapterMetadata,
  MediaEventHandler,
  MediaEventMap,
  MediaKind,
  MediaPlayer,
  MediaPlayerOptions,
  MediaPlugin,
  MediaPluginContext,
  MediaPluginOptions,
  MediaSource,
  MediaSourceConfig,
  PlaybackSnapshot,
  PlaybackState,
  TextTrackConfig,
} from './types.js';
import { TypedEventEmitter } from './internal/event-emitter.js';
import { createMediaElement, isTimeBasedElement, selectBestSource } from './internal/dom.js';

const MEDIA_EVENTS: Array<keyof MediaEventMap> = [
  'play',
  'pause',
  'timeupdate',
  'seeking',
  'seeked',
  'ended',
  'ratechange',
  'volumechange',
  'loadedmetadata',
  'canplay',
  'error',
] as const;

let playerCounter = 0;

export class MediaCorePlayer implements MediaPlayer {
  readonly id: string;

  private currentKind: MediaKind;
  private sourceConfig: MediaSourceConfig;
  private options: MediaPlayerOptions;
  private emitter = new TypedEventEmitter<MediaEventMap>();
  private elementRef: HTMLMediaElement | HTMLImageElement | null = null;
  private host: HTMLElement | null = null;
  private ownsElement = false;
  private currentSource: MediaSource | null = null;
  private state: PlaybackSnapshot;
  private nativeCleanup: Array<() => void> = [];
  private pluginCleanups = new Map<string, () => void>();
  private activeTextTrackId: string | null = null;
  private pendingTextTrackId: string | null | undefined;
  private lazyObserver: IntersectionObserver | null = null;
  private lazyListeners: Array<() => void> = [];
  private lazyActivated = false;

  constructor(config: MediaSourceConfig, options: MediaPlayerOptions = {}) {
    this.id = `media-core-${++playerCounter}`;
    this.sourceConfig = config;
    this.options = options;
    this.currentKind = config.kind;
    this.state = {
      state: 'idle',
      currentTime: 0,
      duration: null,
      buffered: null,
      volume: options.volume ?? 1,
      muted: options.muted ?? false,
      playbackRate: options.playbackRate ?? 1,
    };
    this.pendingTextTrackId = undefined;
  }

  get kind(): MediaKind {
    return this.currentKind;
  }

  get element(): HTMLMediaElement | HTMLImageElement | null {
    return this.elementRef;
  }

  mount(target: HTMLElement | string): void {
    const resolved = this.resolveTarget(target);
    if (!resolved) {
      throw new Error(`MediaCorePlayer: Unable to find mount target for "${target}".`);
    }

    this.teardownLazyObservation();
    if (this.isMediaElement(resolved)) {
      this.attach(resolved);
      return;
    }

    this.host = resolved;
    if (this.options.lazy) {
      this.ownsElement = true;
      this.setupLazyMount(resolved);
      return;
    }

    this.teardownElement(true);
    const element = createMediaElement(this.kind);
    this.ownsElement = true;
    resolved.appendChild(element);
    this.bindToElement(element);
  }

  attach(element: HTMLMediaElement | HTMLImageElement): void {
    this.teardownLazyObservation();
    this.lazyActivated = true;
    if (!this.isCompatibleElement(element)) {
      throw new Error(
        `MediaCorePlayer: Attempted to attach ${element.tagName} while player is configured for ${this.kind}.`,
      );
    }
    this.teardownElement(false);
    this.ownsElement = false;
    this.host = element.parentElement;
    this.bindToElement(element);
  }

  dispose(): void {
    this.teardownElement(true);
    this.teardownLazyObservation();
    this.lazyActivated = false;
    for (const dispose of this.pluginCleanups.values()) {
      dispose();
    }
    this.pluginCleanups.clear();
    this.activeTextTrackId = null;
    this.pendingTextTrackId = undefined;
    this.emitter.emit('dispose', undefined);
    this.emitter.removeAll();
  }

  async play(): Promise<void> {
    this.ensureLazyElementIsMounted();
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      await this.elementRef.play();
      return;
    }
    return Promise.resolve();
  }

  pause(): void {
    this.ensureLazyElementIsMounted();
    if (this.elementRef && isTimeBasedElement(this.elementRef) && !this.elementRef.paused) {
      this.elementRef.pause();
    }
  }

  reload(): void {
    this.ensureLazyElementIsMounted();
    if (!this.elementRef) {
      return;
    }
    if (isTimeBasedElement(this.elementRef)) {
      this.elementRef.load();
    } else {
      // Reapplying the sources will reset the image source.
      this.applySourcesToElement(this.elementRef);
    }
  }

  async decodeImage(): Promise<void> {
    this.ensureLazyElementIsMounted();
    if (!this.elementRef || !(this.elementRef instanceof HTMLImageElement)) {
      return Promise.resolve();
    }

    if (typeof this.elementRef.decode === 'function') {
      await this.elementRef.decode();
      return;
    }

    if (this.elementRef.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onLoad = () => {
        cleanup();
        resolve();
      };
      const onError = (_event: Event) => {
        cleanup();
        reject(new Error('Image decode failed'));
      };
      const cleanup = () => {
        this.elementRef?.removeEventListener('load', onLoad);
        this.elementRef?.removeEventListener('error', onError);
      };
      if (this.elementRef) {
        this.elementRef.addEventListener('load', onLoad);
        this.elementRef.addEventListener('error', onError);
      }
    });
  }

  seekTo(seconds: number): void {
    this.ensureLazyElementIsMounted();
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.currentTime = seconds;
    }
  }

  setVolume(volume: number): void {
    this.ensureLazyElementIsMounted();
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.volume = clamp(volume, 0, 1);
      this.state.volume = this.elementRef.volume;
    }
  }

  setMuted(muted: boolean): void {
    this.ensureLazyElementIsMounted();
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.muted = muted;
      this.state.muted = muted;
    }
  }

  setPlaybackRate(rate: number): void {
    this.ensureLazyElementIsMounted();
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.playbackRate = rate;
      this.state.playbackRate = rate;
    }
  }

  async togglePlayPause(): Promise<void> {
    this.ensureLazyElementIsMounted();
    if (!this.elementRef || !isTimeBasedElement(this.elementRef)) {
      return Promise.resolve();
    }
    if (this.elementRef.paused) {
      return this.elementRef.play();
    }
    this.elementRef.pause();
    return Promise.resolve();
  }

  async setMediaConfig(config: MediaSourceConfig): Promise<void> {
    const kindChanged = config.kind !== this.currentKind;
    if (kindChanged && this.elementRef && !this.ownsElement) {
      throw new Error('MediaCorePlayer: Cannot swap media kind while attached to an external element.');
    }

    this.sourceConfig = config;
    if (!kindChanged) {
      if (this.elementRef) {
        this.applyMediaMetadata(this.elementRef);
        this.applySourcesToElement(this.elementRef);
      }
      return;
    }

    this.currentKind = config.kind;
    if (!this.elementRef || !this.host) {
      return;
    }

    const container = this.host;
    this.teardownElement(true);
    const element = createMediaElement(this.currentKind);
    this.ownsElement = true;
    container.appendChild(element);
    this.bindToElement(element);
  }

  async setSources(sources: MediaSource[]): Promise<void> {
    this.sourceConfig = { ...this.sourceConfig, sources };
    if (this.elementRef) {
      this.applySourcesToElement(this.elementRef);
    }
  }

  getCurrentSource(): MediaSource | null {
    return this.currentSource;
  }

  getState(): PlaybackSnapshot {
    return this.state;
  }

  getCurrentTime(): number {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      return this.elementRef.currentTime;
    }
    return this.state.currentTime;
  }

  getDuration(): number | null {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      return Number.isFinite(this.elementRef.duration) ? this.elementRef.duration : null;
    }
    return this.state.duration;
  }

  getVolume(): number {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      return this.elementRef.volume;
    }
    return this.state.volume;
  }

  isMuted(): boolean {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      return this.elementRef.muted;
    }
    return this.state.muted;
  }

  getPlaybackRate(): number {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      return this.elementRef.playbackRate;
    }
    return this.state.playbackRate;
  }

  getBufferedRanges(): TimeRanges | null {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      return this.elementRef.buffered;
    }
    return this.state.buffered ?? null;
  }

  setCaptionTrack(trackId: string | null): void {
    this.pendingTextTrackId = trackId;
    this.syncTextTracks(true);
  }

  getAvailableCaptionTracks(): TextTrackConfig[] {
    return this.sourceConfig.tracks ? [...this.sourceConfig.tracks] : [];
  }

  getCurrentCaptionTrack(): TextTrackConfig | null {
    if (!this.activeTextTrackId) {
      return null;
    }
    return (
      this.sourceConfig.tracks?.find((track) => track.id === this.activeTextTrackId) ?? null
    );
  }

  getThumbnailForTime(timeInSeconds: number): string | null {
    const thumbnails = this.sourceConfig.previewThumbnails;
    if (!thumbnails) {
      return null;
    }
    const entries = Object.entries(thumbnails)
      .map(([key, value]) => [Number.parseFloat(key), value] as const)
      .filter(([timestamp]) => Number.isFinite(timestamp))
      .sort((a, b) => a[0] - b[0]);

    if (!entries.length) {
      return null;
    }

    const targetTime = Number.isFinite(timeInSeconds) ? timeInSeconds : 0;
    let candidate: string | null = entries[0]?.[1] ?? null;
    if (candidate === null) {
      return null;
    }
    for (const [timestamp, value] of entries) {
      if (targetTime >= timestamp) {
        candidate = value;
      } else {
        break;
      }
    }
    return candidate;
  }

  getChapters(): ChapterMetadata[] {
    return this.sourceConfig.chapters ? [...this.sourceConfig.chapters] : [];
  }

  async enterPictureInPicture(): Promise<void> {
    this.ensureLazyElementIsMounted();
    const video = this.elementRef;
    const request = video && video instanceof HTMLVideoElement ? (video as HTMLVideoElement & { requestPictureInPicture?: () => Promise<void> }).requestPictureInPicture : undefined;
    if (video instanceof HTMLVideoElement && typeof request === 'function') {
      await request.call(video);
    }
  }

  async exitPictureInPicture(): Promise<void> {
    const doc = (this.host?.ownerDocument ?? document) as Document & { exitPictureInPicture?: () => Promise<void>; pictureInPictureElement?: Element | null };
    if (typeof doc.exitPictureInPicture === 'function' && doc.pictureInPictureElement) {
      await doc.exitPictureInPicture();
    }
  }

  isPictureInPictureSupported(): boolean {
    const doc = (this.host?.ownerDocument ?? document) as Document & { pictureInPictureEnabled?: boolean; exitPictureInPicture?: () => Promise<void> };
    const proto = HTMLVideoElement.prototype as HTMLVideoElement & { requestPictureInPicture?: () => Promise<PictureInPictureWindow> };
    const elementSupport = typeof proto.requestPictureInPicture === 'function';
    const documentSupport =
      typeof doc.pictureInPictureEnabled === 'boolean' ? doc.pictureInPictureEnabled : typeof doc.exitPictureInPicture === 'function';
    return Boolean(elementSupport && documentSupport);
  }

  on<E extends keyof MediaEventMap>(event: E, handler: MediaEventHandler<E>): () => void {
    return this.emitter.on(event, handler);
  }

  once<E extends keyof MediaEventMap>(event: E, handler: MediaEventHandler<E>): () => void {
    return this.emitter.once(event, handler);
  }

  off<E extends keyof MediaEventMap>(event: E, handler: MediaEventHandler<E>): void {
    this.emitter.off(event, handler);
  }

  onMount(handler: MediaEventHandler<'mount'>): () => void {
    return this.emitter.on('mount', handler);
  }

  onReady(handler: MediaEventHandler<'ready'>): () => void {
    return this.emitter.on('ready', handler);
  }

  onPlay(handler: MediaEventHandler<'play'>): () => void {
    return this.emitter.on('play', handler);
  }

  onPause(handler: MediaEventHandler<'pause'>): () => void {
    return this.emitter.on('pause', handler);
  }

  onEnd(handler: MediaEventHandler<'ended'>): () => void {
    return this.emitter.on('ended', handler);
  }

  onDispose(handler: MediaEventHandler<'dispose'>): () => void {
    return this.emitter.on('dispose', handler);
  }

  use<TOptions extends MediaPluginOptions = MediaPluginOptions>(
    plugin: MediaPlugin<TOptions>,
    options?: TOptions,
  ): void {
    if (this.pluginCleanups.has(plugin.name)) {
      throw new Error(`MediaCorePlayer: Plugin "${plugin.name}" has already been registered.`);
    }

    const pluginOptions = Object.freeze({ ...(options ?? ({} as TOptions)) }) as Readonly<TOptions>;
    const context: MediaPluginContext<TOptions> = {
      player: this,
      getMediaConfig: () => ({ ...this.sourceConfig }),
      getPlayerOptions: () => ({ ...this.options }),
      options: pluginOptions,
      on: (event, handler) => this.on(event, handler),
      once: (event, handler) => this.once(event, handler),
      off: (event, handler) => this.off(event, handler),
    };

    const dispose = plugin.setup(context);
    const cleanup = typeof dispose === 'function' ? dispose : () => undefined;
    this.pluginCleanups.set(plugin.name, cleanup);
  }

  private bindToElement(element: HTMLMediaElement | HTMLImageElement): void {
    this.elementRef = element;
    this.emitter.emit('mount', { element });
    this.nativeCleanup = [];
    this.applyPlayerOptions(element);
    this.applyMediaMetadata(element);
    this.applySourcesToElement(element);
    this.registerNativeEvents(element);

    // Handle cases where the media is already loaded (e.g., cached image or preloaded video).
    if (!isTimeBasedElement(element)) {
      const img = element as HTMLImageElement;
      if (img.complete && img.naturalWidth > 0) {
        this.handleImageLoad();
      }
      return;
    }

    if (element.readyState >= 1) {
      this.handleLoadedMetadata();
    }
  }

  private registerNativeEvents(element: HTMLMediaElement | HTMLImageElement): void {
    this.nativeCleanup.forEach((cleanup) => cleanup());
    this.nativeCleanup = [];

    if (isTimeBasedElement(element)) {
      const handlerMap: Record<string, () => void> = {
        play: () => this.handlePlaybackEvent('play'),
        pause: () => this.handlePlaybackEvent('pause'),
        seeking: () => this.handlePlaybackEvent('seeking'),
        seeked: () => this.handlePlaybackEvent('seeked'),
        timeupdate: () => this.handlePlaybackEvent('timeupdate'),
        ended: () => this.handlePlaybackEvent('ended'),
        ratechange: () => this.handlePlaybackEvent('ratechange'),
        volumechange: () => this.handlePlaybackEvent('volumechange'),
        loadedmetadata: () => this.handleLoadedMetadata(),
        canplay: () => this.handleCanPlay(),
        error: () => this.handleError(),
      };

      for (const eventName of MEDIA_EVENTS) {
        const handler = handlerMap[eventName as string];
        if (!handler) continue;
        element.addEventListener(eventName as string, handler);
        this.nativeCleanup.push(() => element.removeEventListener(eventName as string, handler));
      }

      if (element instanceof HTMLVideoElement) {
        const onEnterPiP = () => this.emitter.emit('pictureinpictureenter', undefined);
        const onLeavePiP = () => this.emitter.emit('pictureinpictureleave', undefined);
        element.addEventListener('enterpictureinpicture', onEnterPiP);
        element.addEventListener('leavepictureinpicture', onLeavePiP);
        this.nativeCleanup.push(() => element.removeEventListener('enterpictureinpicture', onEnterPiP));
        this.nativeCleanup.push(() => element.removeEventListener('leavepictureinpicture', onLeavePiP));
      }
    } else {
      const img = element as HTMLImageElement;
      const onLoad = () => this.handleImageLoad();
      const onError = () => this.handleImageError();
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      this.nativeCleanup.push(() => img.removeEventListener('load', onLoad));
      this.nativeCleanup.push(() => img.removeEventListener('error', onError));
    }
  }

  private applyMediaMetadata(element: HTMLMediaElement | HTMLImageElement): void {
    if (this.sourceConfig.poster && element instanceof HTMLVideoElement) {
      element.poster = this.sourceConfig.poster;
    } else if (element instanceof HTMLVideoElement) {
      element.removeAttribute('poster');
    }

    if (this.sourceConfig.alt && element instanceof HTMLImageElement) {
      element.alt = this.sourceConfig.alt;
    }
  }

  private applyPlayerOptions(element: HTMLMediaElement | HTMLImageElement): void {
    if (!isTimeBasedElement(element)) {
      if ('decoding' in element && this.options.imageDecodeStrategy) {
        element.decoding = this.options.imageDecodeStrategy;
      }
      this.applyResponsiveLayout(element);
      return;
    }

    const media = element;
    if (typeof this.options.controls === 'boolean') {
      media.controls = this.options.controls;
    }
    if (typeof this.options.loop === 'boolean') {
      media.loop = this.options.loop;
    }
    if (typeof this.options.muted === 'boolean') {
      media.muted = this.options.muted;
    }
    if (typeof this.options.volume === 'number') {
      media.volume = clamp(this.options.volume, 0, 1);
    }
    if (typeof this.options.playbackRate === 'number') {
      media.playbackRate = this.options.playbackRate;
    }
    if (this.options.preload) {
      media.preload = this.options.preload;
    }
    if (typeof this.options.playsInline === 'boolean') {
      if (media instanceof HTMLVideoElement) {
        media.playsInline = this.options.playsInline;
      }
      if (this.options.playsInline) {
        media.setAttribute('playsinline', '');
      } else {
        media.removeAttribute('playsinline');
      }
    }
    if (this.options.autoplay) {
      media.autoplay = true;
      if (this.options.autoplay === 'muted') {
        media.muted = true;
      }
    }
    this.applyResponsiveLayout(media);
  }

  private applySourcesToElement(element: HTMLMediaElement | HTMLImageElement): void {
    const { sources } = this.sourceConfig;
    if (!sources.length) {
      this.clearSources(element);
      this.currentSource = null;
      this.emitter.emit('sourcechange', { source: null });
      this.emitErrorState(new Error('No media sources were provided.'));
      return;
    }

    const selected = selectBestSource(element, sources);
    if (!selected) {
      this.clearSources(element);
      this.currentSource = null;
      this.emitErrorState(new Error('No playable sources were provided.'));
      return;
    }

    this.currentSource = selected;
    if (isTimeBasedElement(element)) {
      this.applyTimeBasedSources(element, sources, selected);
    } else {
      const img = element as HTMLImageElement;
      if (img.src === selected.src) {
        img.src = '';
      }
      img.src = selected.src;
    }
    this.emitter.emit('sourcechange', { source: selected });
  }

  private applyTimeBasedSources(element: HTMLMediaElement, sources: MediaSource[], selected: MediaSource): void {
    const existingChildren = Array.from(element.querySelectorAll('source[data-managed="media-core"]'));
    existingChildren.forEach((child) => child.remove());

    if (sources.length === 1) {
      element.src = selected.src;
    } else {
      element.removeAttribute('src');
      for (const source of sources) {
        const sourceNode = document.createElement('source');
        sourceNode.dataset.managed = 'media-core';
        sourceNode.src = source.src;
        if (source.type) {
          sourceNode.type = source.type;
        }
        if (source.label) {
          sourceNode.setAttribute('data-label', source.label);
        }
        element.appendChild(sourceNode);
      }
    }

    if (this.sourceConfig.tracks?.length) {
      this.applyTextTracks(element, this.sourceConfig.tracks);
    }

    element.load();
    this.syncTextTracks(false);
  }

  private applyTextTracks(element: HTMLMediaElement, tracks: MediaSourceConfig['tracks']): void {
    const managedTracks = Array.from(element.querySelectorAll('track[data-managed="media-core-track"]'));
    managedTracks.forEach((track) => track.remove());

    if (!tracks) return;

    for (const track of tracks) {
      const trackNode = document.createElement('track');
      trackNode.dataset.managed = 'media-core-track';
      trackNode.kind = track.kind;
      trackNode.src = track.src;
      if (track.label) trackNode.label = track.label;
      if (track.srclang) trackNode.srclang = track.srclang;
      if (track.id) trackNode.id = track.id;
      if (track.default) trackNode.default = true;
      element.appendChild(trackNode);
    }
  }

  private clearSources(element: HTMLMediaElement | HTMLImageElement): void {
    if (isTimeBasedElement(element)) {
      element.removeAttribute('src');
      element.load();
      return;
    }
    (element as HTMLImageElement).removeAttribute('src');
  }

  private handlePlaybackEvent(eventName: keyof MediaEventMap): void {
    this.updateSnapshot();
    this.emitter.emit(eventName, this.state);
  }

  private handleLoadedMetadata(): void {
    this.updateSnapshot('ready');
    this.updateAspectRatioFromMetrics();
    this.syncTextTracks(false);
    this.emitter.emit('loadedmetadata', this.state);
    this.emitter.emit('ready', this.state);
  }

  private handleCanPlay(): void {
    this.updateSnapshot();
    this.emitter.emit('canplay', this.state);
  }

  private handleError(): void {
    const element = this.elementRef;
    const mediaError = element && isTimeBasedElement(element) && element.error;
    const error = mediaError
      ? new Error(`Media error: ${mediaError.message || 'Unknown media error'}`)
      : new Error('Media error occurred.');
    this.emitErrorState(error);
  }

  private handleImageLoad(): void {
    this.updateSnapshot('ready');
    this.updateAspectRatioFromMetrics();
    const img = this.elementRef as HTMLImageElement;
    this.emitter.emit('imageload', {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
    this.emitter.emit('ready', this.state);
  }

  private handleImageError(): void {
    const error = new Error('Image failed to load.');
    this.emitErrorState(error);
    this.emitter.emit('imageerror', { error });
  }

  private updateSnapshot(forcedState?: PlaybackState, forcedError?: Error): void {
    const element = this.elementRef;
    if (!element) {
      return;
    }

    if (isTimeBasedElement(element)) {
      const derivedState = forcedState ?? deriveStateFromElement(element, this.state.state);
      const error = derivedState === 'error' ? (forcedError ?? element.error ?? this.state.error) : undefined;
      this.state = {
        state: derivedState,
        currentTime: element.currentTime ?? 0,
        duration: Number.isFinite(element.duration) ? element.duration : null,
        buffered: element.buffered ?? null,
        volume: element.volume,
        muted: element.muted,
        playbackRate: element.playbackRate,
        source: this.currentSource ?? undefined,
        metrics:
          element instanceof HTMLVideoElement && element.videoWidth
            ? {
                width: element.videoWidth,
                height: element.videoHeight,
                aspectRatio:
                  element.videoWidth && element.videoHeight ? element.videoWidth / element.videoHeight : undefined,
              }
            : undefined,
        error,
      };
      return;
    }

    const img = element as HTMLImageElement;
    this.state = {
      state: forcedState ?? (img.complete ? 'ready' : 'loading'),
      currentTime: 0,
      duration: null,
      buffered: null,
      volume: 1,
      muted: true,
      playbackRate: 1,
      source: this.currentSource ?? undefined,
      metrics:
        img.naturalWidth > 0
          ? {
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : undefined,
            }
          : undefined,
      error: forcedState === 'error' ? (forcedError ?? this.state.error) : undefined,
    };
  }

  private ensureLazyElementIsMounted(): void {
    if (!this.options.lazy || this.elementRef) {
      return;
    }
    this.activateLazyMount();
  }

  private setupLazyMount(container: HTMLElement): void {
    this.teardownElement(true);
    this.teardownLazyObservation();
    this.lazyActivated = false;

    const triggerMount = () => this.activateLazyMount();
    for (const eventName of ['pointerdown', 'touchstart', 'keydown', 'click']) {
      const options: AddEventListenerOptions | undefined =
        eventName === 'keydown' || eventName === 'click' ? undefined : { passive: true };
      container.addEventListener(eventName, triggerMount, options);
      this.lazyListeners.push(() => container.removeEventListener(eventName, triggerMount, options));
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.lazyObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.activateLazyMount();
        }
      });
      this.lazyObserver.observe(container);
    }
  }

  private activateLazyMount(): void {
    if (this.lazyActivated) {
      return;
    }
    const container = this.host;
    if (!container) {
      return;
    }
    this.lazyActivated = true;
    this.teardownLazyObservation();
    const element = createMediaElement(this.currentKind);
    this.ownsElement = true;
    container.appendChild(element);
    this.bindToElement(element);
  }

  private teardownLazyObservation(): void {
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
      this.lazyObserver = null;
    }
    for (const cleanup of this.lazyListeners) {
      cleanup();
    }
    this.lazyListeners = [];
  }

  private syncTextTracks(emitEvent: boolean): void {
    const targetId = this.getDesiredTextTrackId();
    const applied = this.applyTextTrackSelection(targetId, emitEvent);
    if (!applied && targetId && this.pendingTextTrackId === targetId) {
      this.pendingTextTrackId = undefined;
      const fallbackId = this.getDesiredTextTrackId();
      if (fallbackId !== targetId) {
        this.applyTextTrackSelection(fallbackId, emitEvent);
      }
    }
  }

  private getDesiredTextTrackId(): string | null {
    if (this.pendingTextTrackId !== undefined) {
      return this.pendingTextTrackId;
    }
    if (typeof this.options.defaultTextTrackId === 'string') {
      return this.options.defaultTextTrackId;
    }
    const defaultTrack = this.sourceConfig.tracks?.find((track) => track.default);
    return defaultTrack?.id ?? null;
  }

  private applyTextTrackSelection(targetId: string | null, emitEvent: boolean): boolean {
    const media = this.elementRef;
    const previous = this.activeTextTrackId;

    if (!media || !isTimeBasedElement(media)) {
      this.activeTextTrackId = targetId ?? null;
      this.emitTextTrackChange(previous, emitEvent);
      return true;
    }

    const textTracks = media.textTracks;
    if (!textTracks || typeof textTracks.length !== 'number') {
      this.activeTextTrackId = targetId ?? null;
      this.emitTextTrackChange(previous, emitEvent);
      return true;
    }

    if (textTracks.length === 0) {
      this.activeTextTrackId = null;
      this.emitTextTrackChange(previous, emitEvent);
      return true;
    }

    if (targetId === null) {
      this.disableAllTextTracks(textTracks);
      this.activeTextTrackId = null;
      this.emitTextTrackChange(previous, emitEvent);
      return true;
    }

    let found = false;
    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i];
      if (!track) continue;
      const currentId = this.getTextTrackId(track);
      if (currentId && currentId === targetId) {
        track.mode = 'showing';
        found = true;
      } else {
        track.mode = 'disabled';
      }
    }

    if (!found) {
      this.disableAllTextTracks(textTracks);
      this.activeTextTrackId = null;
      this.emitTextTrackChange(previous, emitEvent);
      return false;
    }

    this.activeTextTrackId = targetId;
    this.emitTextTrackChange(previous, emitEvent);
    return true;
  }

  private disableAllTextTracks(list: TextTrackList): void {
    for (let i = 0; i < list.length; i++) {
      const track = list[i];
      if (track) {
        track.mode = 'disabled';
      }
    }
  }

  private getTextTrackId(track: TextTrack): string | null {
    const anyTrack = track as TextTrack & { id?: string };
    if (typeof anyTrack.id === 'string' && anyTrack.id.trim().length > 0) {
      return anyTrack.id;
    }
    if (typeof track.label === 'string' && track.label.trim().length > 0) {
      return track.label.trim();
    }
    return null;
  }

  private emitTextTrackChange(previous: string | null, emitEvent: boolean): void {
    if (!emitEvent || previous === this.activeTextTrackId) {
      return;
    }
    this.emitter.emit('trackchange', {
      kind: 'text',
      id: this.activeTextTrackId ?? undefined,
    });
  }

  private resolveTarget(target: HTMLElement | string): HTMLElement | null {
    if (typeof target === 'string') {
      return document.querySelector<HTMLElement>(target);
    }
    return target;
  }

  private teardownElement(removeFromDom: boolean): void {
    if (!this.elementRef) {
      return;
    }
    for (const cleanup of this.nativeCleanup) {
      cleanup();
    }
    this.nativeCleanup = [];
    if (removeFromDom && this.ownsElement && this.elementRef.parentElement) {
      this.elementRef.parentElement.removeChild(this.elementRef);
    }
    this.elementRef = null;
    this.activeTextTrackId = null;
  }

  private isMediaElement(node: Element): node is HTMLMediaElement | HTMLImageElement {
    return node instanceof HTMLMediaElement || node instanceof HTMLImageElement;
  }

  private isCompatibleElement(element: HTMLMediaElement | HTMLImageElement): boolean {
    if (this.currentKind === 'image') {
      return element instanceof HTMLImageElement;
    }
    if (this.currentKind === 'audio') {
      return element instanceof HTMLAudioElement;
    }
    return element instanceof HTMLVideoElement;
  }

  private emitErrorState(error: Error): void {
    this.updateSnapshot('error', error);
    this.emitter.emit('error', this.state);
  }

  private applyResponsiveLayout(element: HTMLMediaElement | HTMLImageElement): void {
    if (this.options.responsive === false) {
      element.style.removeProperty('width');
      element.style.removeProperty('max-width');
      element.style.removeProperty('height');
      element.style.removeProperty('aspect-ratio');
      element.style.removeProperty('display');
      return;
    }

    element.style.display = 'block';
    element.style.width = '100%';
    element.style.maxWidth = '100%';

    if (this.currentKind !== 'audio') {
      element.style.height = 'auto';
    }

    if (this.currentKind === 'audio') {
      element.style.removeProperty('aspect-ratio');
      return;
    }

    const aspectRatio = normalizeAspectRatio(this.options.aspectRatio);
    if (aspectRatio) {
      element.style.aspectRatio = aspectRatio;
      return;
    }

    element.style.removeProperty('aspect-ratio');
  }

  private updateAspectRatioFromMetrics(): void {
    if (!this.elementRef || this.currentKind === 'audio') {
      return;
    }
    if (this.options.responsive === false) {
      return;
    }
    if (normalizeAspectRatio(this.options.aspectRatio)) {
      return;
    }
    const ratio = this.state.metrics?.aspectRatio;
    if (!ratio || !Number.isFinite(ratio)) {
      return;
    }
    this.elementRef.style.aspectRatio = `${ratio}`;
    this.elementRef.style.height = 'auto';
  }
}

function deriveStateFromElement(element: HTMLMediaElement, fallback: PlaybackState): PlaybackState {
  if (element.error) return 'error';
  if (element.ended) return 'ended';
  if (element.readyState <= element.HAVE_METADATA && element.networkState === element.NETWORK_LOADING) {
    return 'loading';
  }
  if (element.paused) {
    return element.currentTime > 0 ? 'paused' : fallback;
  }
  return 'playing';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeAspectRatio(input?: number | string): string | null {
  if (typeof input === 'number' && Number.isFinite(input) && input > 0) {
    return `${input}`;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed.toLowerCase() === 'auto') {
      return null;
    }
    const separator = trimmed.includes(':') ? ':' : trimmed.includes('/') ? '/' : null;
    if (separator) {
      const parts = trimmed.split(separator).map((value) => Number.parseFloat(value));
      if (parts.length >= 2) {
        const first = parts[0];
        const second = parts[1];
        if (
          typeof first === 'number' &&
          typeof second === 'number' &&
          Number.isFinite(first) &&
          Number.isFinite(second) &&
          second > 0
        ) {
          return `${first} / ${second}`;
        }
      }
    }
    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric}`;
    }
  }
  return null;
}
