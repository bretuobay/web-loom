import type {
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

    if (this.isMediaElement(resolved)) {
      this.attach(resolved);
      return;
    }

    this.teardownElement(true);
    const element = createMediaElement(this.kind);
    this.ownsElement = true;
    this.host = resolved;
    resolved.appendChild(element);
    this.bindToElement(element);
  }

  attach(element: HTMLMediaElement | HTMLImageElement): void {
    if (!this.isCompatibleElement(element)) {
      throw new Error(
        `MediaCorePlayer: Attempted to attach ${element.tagName} while player is configured for ${this.kind}.`
      );
    }
    this.teardownElement(false);
    this.ownsElement = false;
    this.host = element.parentElement;
    this.bindToElement(element);
  }

  dispose(): void {
    this.teardownElement(true);
    for (const dispose of this.pluginCleanups.values()) {
      dispose();
    }
    this.pluginCleanups.clear();
    this.emitter.emit('dispose', undefined);
    this.emitter.removeAll();
  }

  async play(): Promise<void> {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      await this.elementRef.play();
      return;
    }
    return Promise.resolve();
  }

  pause(): void {
    if (this.elementRef && isTimeBasedElement(this.elementRef) && !this.elementRef.paused) {
      this.elementRef.pause();
    }
  }

  reload(): void {
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
      const onError = (event: ErrorEvent) => {
        cleanup();
        reject(event.error ?? new Error('Image decode failed'));
      };
      const cleanup = () => {
        this.elementRef?.removeEventListener('load', onLoad);
        this.elementRef?.removeEventListener('error', onError);
      };
      this.elementRef.addEventListener('load', onLoad);
      this.elementRef.addEventListener('error', onError);
    });
  }

  seekTo(seconds: number): void {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.currentTime = seconds;
    }
  }

  setVolume(volume: number): void {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.volume = clamp(volume, 0, 1);
      this.state.volume = this.elementRef.volume;
    }
  }

  setMuted(muted: boolean): void {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.muted = muted;
      this.state.muted = muted;
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.elementRef && isTimeBasedElement(this.elementRef)) {
      this.elementRef.playbackRate = rate;
      this.state.playbackRate = rate;
    }
  }

  async togglePlayPause(): Promise<void> {
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
      throw new Error(
        'MediaCorePlayer: Cannot swap media kind while attached to an external element.'
      );
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
    options?: TOptions
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
    this.nativeCleanup.forEach(cleanup => cleanup());
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
      media.playsInline = this.options.playsInline;
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

  private applyTimeBasedSources(
    element: HTMLMediaElement,
    sources: MediaSource[],
    selected: MediaSource
  ): void {
    const existingChildren = Array.from(
      element.querySelectorAll('source[data-managed="media-core"]')
    );
    existingChildren.forEach(child => child.remove());

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
  }

  private applyTextTracks(element: HTMLMediaElement, tracks: MediaSourceConfig['tracks']): void {
    const managedTracks = Array.from(
      element.querySelectorAll('track[data-managed="media-core-track"]')
    );
    managedTracks.forEach(track => track.remove());

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
    this.emitter.emit('loadedmetadata', this.state);
    this.emitter.emit('ready', this.state);
  }

  private handleCanPlay(): void {
    this.updateSnapshot();
    this.emitter.emit('canplay', this.state);
  }

  private handleError(): void {
    const element = this.elementRef;
    const error =
      (element && isTimeBasedElement(element) && element.error) || new Error('Media error occurred.');
    this.emitErrorState(error);
  }

  private handleImageLoad(): void {
    this.updateSnapshot('ready');
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
      const error =
        derivedState === 'error'
          ? forcedError ?? element.error ?? this.state.error
          : undefined;
      this.state = {
        state: derivedState,
        currentTime: element.currentTime ?? 0,
        duration: Number.isFinite(element.duration) ? element.duration : null,
        buffered: element.buffered ?? null,
        volume: element.volume,
        muted: element.muted,
        playbackRate: element.playbackRate,
        source: this.currentSource ?? undefined,
        metrics: element.videoWidth
          ? {
              width: element.videoWidth,
              height: element.videoHeight,
              aspectRatio:
                element.videoWidth && element.videoHeight
                  ? element.videoWidth / element.videoHeight
                  : undefined,
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
              aspectRatio:
                img.naturalWidth && img.naturalHeight
                  ? img.naturalWidth / img.naturalHeight
                  : undefined,
            }
          : undefined,
      error: forcedState === 'error' ? forcedError ?? this.state.error : undefined,
    };
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
