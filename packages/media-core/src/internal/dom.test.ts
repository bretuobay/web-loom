import { describe, it, expect, vi } from 'vitest';
import { createMediaElement, isTimeBasedElement, selectBestSource } from './dom.js';
import type { MediaSource } from '../types.js';

describe('dom helpers', () => {
  it('creates appropriate media elements for each kind', () => {
    const video = createMediaElement('video');
    const audio = createMediaElement('audio');
    const image = createMediaElement('image');

    expect(video.tagName).toBe('VIDEO');
    expect(audio.tagName).toBe('AUDIO');
    expect(image.tagName).toBe('IMG');
  });

  it('identifies time-based elements correctly', () => {
    const video = document.createElement('video');
    const img = document.createElement('img');
    expect(isTimeBasedElement(video)).toBe(true);
    expect(isTimeBasedElement(img)).toBe(false);
  });

  it('selects the most suitable playable source for media elements', () => {
    const video = document.createElement('video');
    vi.spyOn(video, 'canPlayType').mockImplementation(type => (type === 'video/mp4' ? 'probably' : ''));

    const sources: MediaSource[] = [
      { src: '/movie.webm', type: 'video/webm' },
      { src: '/movie.mp4', type: 'video/mp4' },
    ];

    const result = selectBestSource(video, sources);
    expect(result?.src).toBe('/movie.mp4');
  });

  it('falls back to a typeless source if no supported type is found', () => {
    const video = document.createElement('video');
    vi.spyOn(video, 'canPlayType').mockReturnValue('');

    const sources: MediaSource[] = [
      { src: '/unknown.webm', type: 'video/webm' },
      { src: '/mystery', type: undefined },
    ];

    const result = selectBestSource(video, sources);
    expect(result?.src).toBe('/mystery');
  });

  it('returns null when no playable sources exist', () => {
    const video = document.createElement('video');
    vi.spyOn(video, 'canPlayType').mockReturnValue('');

    const sources: MediaSource[] = [
      { src: '/movie.webm', type: 'video/webm' },
      { src: '/movie.ogg', type: 'video/ogg' },
    ];

    expect(selectBestSource(video, sources)).toBeNull();
  });

  it('prefers MP4 when available among baseline video formats', () => {
    const video = document.createElement('video');
    vi.spyOn(video, 'canPlayType').mockImplementation((type) => (type === 'video/mp4' ? 'probably' : ''));

    const sources: MediaSource[] = [
      { src: '/clip.webm', type: 'video/webm' },
      { src: '/clip.ogg', type: 'video/ogg' },
      { src: '/clip.mp4', type: 'video/mp4' },
    ];

    expect(selectBestSource(video, sources)?.src).toBe('/clip.mp4');
  });

  it('prefers MP3 when available among baseline audio formats', () => {
    const audio = document.createElement('audio');
    vi.spyOn(audio, 'canPlayType').mockImplementation((type) => (type === 'audio/mp3' ? 'probably' : ''));

    const sources: MediaSource[] = [
      { src: '/track.ogg', type: 'audio/ogg' },
      { src: '/track.wav', type: 'audio/wav' },
      { src: '/track.mp3', type: 'audio/mp3' },
    ];

    expect(selectBestSource(audio, sources)?.src).toBe('/track.mp3');
  });
});
