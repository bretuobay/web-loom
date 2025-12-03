import type { MediaKind, MediaSource } from '../types.js';

export function createMediaElement(kind: MediaKind): HTMLMediaElement | HTMLImageElement {
  if (kind === 'image') {
    return document.createElement('img');
  }
  if (kind === 'audio') {
    return document.createElement('audio');
  }
  return document.createElement('video');
}

export function isTimeBasedElement(
  element: HTMLMediaElement | HTMLImageElement
): element is HTMLMediaElement {
  return element.tagName === 'VIDEO' || element.tagName === 'AUDIO';
}

export function selectBestSource(
  element: HTMLMediaElement | HTMLImageElement,
  sources: MediaSource[]
): MediaSource | null {
  if (!sources.length) {
    return null;
  }

  if (!isTimeBasedElement(element)) {
    return sources[0] ?? null;
  }

  let fallback: MediaSource | null = null;

  for (const source of sources) {
    if (!source.type) {
      fallback = fallback ?? source;
      continue;
    }

    const result = element.canPlayType(source.type);
    if (result === 'probably') {
      return source;
    }
    if (result === 'maybe' && !fallback) {
      fallback = source;
    }
  }

  return fallback;
}
