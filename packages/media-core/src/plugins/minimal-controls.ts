import type { MediaPlugin } from '../types.js';
import './minimal-controls.css';

export interface MinimalControlsOptions {
  showTime?: boolean;
  labels?: {
    play?: string;
    pause?: string;
    mute?: string;
    unmute?: string;
  };
  [key: string]: unknown;
}

const defaultLabels = {
  play: 'Play',
  pause: 'Pause',
  mute: 'Mute',
  unmute: 'Unmute',
};

export const minimalControlsPlugin: MediaPlugin<MinimalControlsOptions> = {
  name: 'minimal-controls',
  setup({ player, on, options }) {
    const labels = { ...defaultLabels, ...(options?.labels ?? {}) };
    let container: HTMLElement | null = null;
    let playButton: HTMLButtonElement | null = null;
    let muteButton: HTMLButtonElement | null = null;
    let timeLabel: HTMLElement | null = null;
    let progress: HTMLInputElement | null = null;

    const ensureContainer = () => {
      if (container) return container;
      const host = document.createElement('div');
      host.className = 'media-core-controls';
      host.innerHTML = `
        <button class="media-core-button media-core-play" type="button">${labels.play}</button>
        <input class="media-core-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Scrub timeline" />
        <button class="media-core-button media-core-mute" type="button">${labels.mute}</button>
        <div class="media-core-time" aria-live="off"></div>
      `;
      container = host;
      playButton = host.querySelector('.media-core-play') as HTMLButtonElement;
      muteButton = host.querySelector('.media-core-mute') as HTMLButtonElement;
      timeLabel = host.querySelector('.media-core-time') as HTMLElement;
      progress = host.querySelector('.media-core-progress') as HTMLInputElement;
      attachListeners();
      return host;
    };

    const attachListeners = () => {
      playButton?.addEventListener('click', () => {
        if (!player.element) return;
        if (player.element instanceof HTMLMediaElement && player.element.paused) {
          void player.play();
        } else {
          player.pause();
        }
      });
      muteButton?.addEventListener('click', () => {
        if (!player.element || !(player.element instanceof HTMLMediaElement)) return;
        player.setMuted(!player.element.muted);
        updateMuteState();
      });
      progress?.addEventListener('input', (event) => {
        if (!player.element || !(player.element instanceof HTMLMediaElement)) return;
        const target = event.currentTarget as HTMLInputElement;
        const duration = player.getDuration();
        if (!duration) return;
        const nextTime = (Number(target.value) / 100) * duration;
        player.seekTo(nextTime);
      });
    };

    const updatePlayState = () => {
      if (!playButton) return;
      const isPaused = !player.element || !(player.element instanceof HTMLMediaElement) || player.element.paused;
      playButton.textContent = isPaused ? labels.play : labels.pause;
    };

    const updateMuteState = () => {
      if (!muteButton || !player.element || !(player.element instanceof HTMLMediaElement)) return;
      muteButton.textContent = player.element.muted ? labels.unmute : labels.mute;
    };

    const updateTime = () => {
      if (!timeLabel || options?.showTime === false) return;
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      timeLabel.textContent = `${formatTime(current)} / ${duration ? formatTime(duration) : '--:--'}`;
      if (progress && duration && duration > 0) {
        progress.value = ((current / duration) * 100).toString();
      }
    };

    const mountDisposer = on('mount', ({ element }) => {
      const controls = ensureContainer();
      if (!element.parentElement) {
        element.insertAdjacentElement('afterend', controls);
        return;
      }
      element.parentElement.style.position ||= 'relative';
      element.parentElement.appendChild(controls);
    });

    const readyDisposer = on('ready', () => {
      updatePlayState();
      updateMuteState();
      updateTime();
    });
    const playDisposer = on('play', () => {
      updatePlayState();
    });
    const pauseDisposer = on('pause', () => {
      updatePlayState();
    });
    const timeUpdateDisposer = on('timeupdate', () => {
      updateTime();
    });
    const volumeChangeDisposer = on('volumechange', () => {
      updateMuteState();
    });

    const cleanup = () => {
      mountDisposer();
      readyDisposer();
      playDisposer();
      pauseDisposer();
      timeUpdateDisposer();
      volumeChangeDisposer();
      if (container?.parentElement) {
        container.parentElement.removeChild(container);
      }
      container = null;
      playButton = null;
      muteButton = null;
      timeLabel = null;
      progress = null;
    };

    return cleanup;
  },
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return '--:--';
  }
  const rounded = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(rounded / 60)
    .toString()
    .padStart(2, '0');
  const secs = (rounded % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}
