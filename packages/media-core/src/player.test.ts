import { describe, it, expect, vi } from 'vitest';
import { MediaCorePlayer } from './player.js';
import { MockIntersectionObserver } from './test-utils/media-stubs.js';

describe('MediaCorePlayer lifecycle hooks', () => {
  it('invokes mount, ready, and dispose hooks for image media', () => {
    const player = new MediaCorePlayer({
      kind: 'image',
      sources: [{ src: '/poster.png' }],
    });

    const mountSpy = vi.fn();
    const readySpy = vi.fn();
    const disposeSpy = vi.fn();

    player.onMount(({ element }) => mountSpy(element.tagName));
    player.onReady(readySpy);
    player.onDispose(disposeSpy);

    const container = document.createElement('div');
    player.mount(container);

    const image = container.querySelector('img');
    expect(image).toBeTruthy();

    image?.dispatchEvent(new Event('load'));

    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(mountSpy).toHaveBeenCalledWith('IMG');
    expect(readySpy).toHaveBeenCalledWith(expect.objectContaining({ state: 'ready' }));

    player.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('invokes playback lifecycle hooks for video media', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/clip.mp4', type: 'video/mp4' }],
    });

    const readySpy = vi.fn();
    const playSpy = vi.fn();
    const pauseSpy = vi.fn();
    const endSpy = vi.fn();

    player.onReady(readySpy);
    player.onPlay(playSpy);
    player.onPause(pauseSpy);
    player.onEnd(endSpy);

    const container = document.createElement('div');
    player.mount(container);

    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    video?.dispatchEvent(new Event('loadedmetadata'));
    expect(readySpy).toHaveBeenCalled();

    video?.dispatchEvent(new Event('play'));
    video?.dispatchEvent(new Event('pause'));
    video?.dispatchEvent(new Event('ended'));

    expect(playSpy).toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
    expect(endSpy).toHaveBeenCalled();
  });

  it('applies responsive styles with an explicit aspect ratio', () => {
    const player = new MediaCorePlayer(
      {
        kind: 'video',
        sources: [{ src: '/responsive.mp4', type: 'video/mp4' }],
      },
      { aspectRatio: '16:9', responsive: true },
    );

    const container = document.createElement('div');
    player.mount(container);

    const video = container.querySelector('video');
    expect(video?.style.width).toBe('100%');
    expect(video?.style.aspectRatio).toBe('16 / 9');
  });

  it('derives aspect ratio from intrinsic video metrics when not provided', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/derived.mp4', type: 'video/mp4' }],
    });
    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    if (video) {
      Object.defineProperty(video, 'videoWidth', {
        configurable: true,
        value: 1280,
      });
      Object.defineProperty(video, 'videoHeight', {
        configurable: true,
        value: 720,
      });
    }
    video?.dispatchEvent(new Event('loadedmetadata'));
    expect(video?.style.aspectRatio).toBe(String(1280 / 720));
  });

  it('defers element creation when lazy mounting until visible', () => {
    MockIntersectionObserver.reset();
    const player = new MediaCorePlayer(
      {
        kind: 'video',
        sources: [{ src: '/lazy.mp4', type: 'video/mp4' }],
      },
      { lazy: true },
    );
    const container = document.createElement('div');
    player.mount(container);
    expect(container.querySelector('video')).toBeNull();

    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeTruthy();
    observer?.trigger({ isIntersecting: true, target: container });
    expect(container.querySelector('video')).toBeTruthy();
  });

  it('activates lazy mount when interacting with the container', async () => {
    MockIntersectionObserver.reset();
    const player = new MediaCorePlayer(
      {
        kind: 'video',
        sources: [{ src: '/lazy-interact.mp4', type: 'video/mp4' }],
      },
      { lazy: true },
    );
    const container = document.createElement('div');
    player.mount(container);
    expect(container.querySelector('video')).toBeNull();

    await player.play();
    expect(container.querySelector('video')).toBeTruthy();
  });

  it('manages caption tracks and exposes caption APIs', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/captions.mp4', type: 'video/mp4' }],
      tracks: [
        { id: 'en', kind: 'subtitles', label: 'English', src: '/en.vtt', srclang: 'en', default: true },
        { id: 'es', kind: 'subtitles', label: 'Spanish', src: '/es.vtt', srclang: 'es' },
      ],
    });

    const changeSpy = vi.fn();
    player.on('trackchange', changeSpy);

    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    if (video) {
      const tracks = attachFakeTextTracks(video, ['en', 'es']);
      video.dispatchEvent(new Event('loadedmetadata'));
      expect(tracks[0].mode).toBe('showing');
      expect(player.getCurrentCaptionTrack()?.id).toBe('en');
      expect(player.getAvailableCaptionTracks()).toHaveLength(2);

      player.setCaptionTrack('es');
      expect(tracks[1].mode).toBe('showing');
      expect(tracks[0].mode).toBe('disabled');
      expect(player.getCurrentCaptionTrack()?.id).toBe('es');
      expect(changeSpy).toHaveBeenCalled();

      player.setCaptionTrack(null);
      expect(tracks[1].mode).toBe('disabled');
      expect(player.getCurrentCaptionTrack()).toBeNull();
    }
  });

  it('returns thumbnail URLs closest to the requested playback time', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/thumbs.mp4', type: 'video/mp4' }],
      previewThumbnails: {
        0: '/thumb-0.jpg',
        10: '/thumb-10.jpg',
        30: '/thumb-30.jpg',
      },
    });

    expect(player.getThumbnailForTime(0)).toBe('/thumb-0.jpg');
    expect(player.getThumbnailForTime(15)).toBe('/thumb-10.jpg');
    expect(player.getThumbnailForTime(40)).toBe('/thumb-30.jpg');
    expect(player.getThumbnailForTime(-5)).toBe('/thumb-0.jpg');
  });

  it('returns chapter metadata from the current source configuration', () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/chapters.mp4', type: 'video/mp4' }],
      chapters: [
        { id: 'intro', title: 'Intro', startTime: 0, endTime: 5 },
        { id: 'middle', title: 'Middle', startTime: 5, endTime: 15 },
      ],
    });

    const chapters = player.getChapters();
    expect(chapters).toHaveLength(2);
    expect(chapters[0].id).toBe('intro');
    chapters.push({ id: 'extra', title: 'Extra', startTime: 30 });
    expect(player.getChapters()).toHaveLength(2);
  });

  it('handles picture-in-picture helpers and events', async () => {
    const player = new MediaCorePlayer({
      kind: 'video',
      sources: [{ src: '/pip.mp4', type: 'video/mp4' }],
    });
    const enterSpy = vi.fn();
    const leaveSpy = vi.fn();
    player.on('pictureinpictureenter', enterSpy);
    player.on('pictureinpictureleave', leaveSpy);

    const container = document.createElement('div');
    player.mount(container);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    let pipElement: Element | null = null;
    const originalExit = (document as Document & { exitPictureInPicture?: () => Promise<void> }).exitPictureInPicture;
    const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'pictureInPictureElement');
    const exitSpy = vi.fn().mockImplementation(async () => {
      pipElement = null;
    });
    Object.defineProperty(document, 'exitPictureInPicture', {
      configurable: true,
      value: exitSpy,
    });
    Object.defineProperty(document, 'pictureInPictureElement', {
      configurable: true,
      get: () => pipElement,
      set: (value) => {
        pipElement = value as Element | null;
      },
    });
    const requestSpy = vi.fn().mockImplementation(() => {
      pipElement = video ?? null;
      return Promise.resolve();
    });
    if (video) {
      Object.defineProperty(video, 'requestPictureInPicture', {
        configurable: true,
        value: requestSpy,
      });
    }

    await player.enterPictureInPicture();
    expect(requestSpy).toHaveBeenCalled();
    video?.dispatchEvent(new Event('enterpictureinpicture'));
    expect(enterSpy).toHaveBeenCalled();

    await player.exitPictureInPicture();
    expect(exitSpy).toHaveBeenCalled();
    video?.dispatchEvent(new Event('leavepictureinpicture'));
    expect(leaveSpy).toHaveBeenCalled();

    if (video) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (video as HTMLVideoElement & { requestPictureInPicture?: () => Promise<void> }).requestPictureInPicture;
    }
    if (originalExit) {
      Object.defineProperty(document, 'exitPictureInPicture', {
        configurable: true,
        value: originalExit,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (document as Document & { exitPictureInPicture?: () => Promise<void> }).exitPictureInPicture;
    }
    if (originalDescriptor) {
      Object.defineProperty(document, 'pictureInPictureElement', originalDescriptor);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (document as Document & { pictureInPictureElement?: Element | null }).pictureInPictureElement;
    }
  });
});

function attachFakeTextTracks(element: HTMLVideoElement, ids: string[]) {
  const tracks = ids.map(
    (id) =>
      ({
        id,
        kind: 'subtitles',
        label: id,
        language: id,
        mode: 'disabled',
        cues: null,
        activeCues: null,
        addCue: vi.fn(),
        removeCue: vi.fn(),
        oncuechange: null,
      }) as unknown as TextTrack,
  );
  const list: TextTrackList & Record<number, TextTrack> = {
    length: tracks.length,
    item: (index: number) => tracks[index] ?? null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
    onaddtrack: null,
    onremovetrack: null,
    onchange: null,
  } as unknown as TextTrackList & Record<number, TextTrack>;
  tracks.forEach((track, index) => {
    list[index] = track;
  });
  Object.defineProperty(element, 'textTracks', {
    configurable: true,
    value: list,
  });
  return tracks;
}
