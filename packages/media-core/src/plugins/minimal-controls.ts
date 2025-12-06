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
  /**
   * Number of seconds to seek when using keyboard shortcuts.
   */
  seekStepSeconds?: number;
  /**
   * Amount to change the volume (0-1) when using keyboard shortcuts.
   */
  volumeStep?: number;
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
    const keyboardSeekStep = typeof options?.seekStepSeconds === 'number' ? options.seekStepSeconds : 5;
    const keyboardVolumeStep = typeof options?.volumeStep === 'number' ? options.volumeStep : 0.05;
    const sliderDescriptionId = `${player.id}-timeline-instructions`;
    const timeLabelId = `${player.id}-time-label`;
    let container: HTMLElement | null = null;
    let playButton: HTMLButtonElement | null = null;
    let muteButton: HTMLButtonElement | null = null;
    let timeLabel: HTMLElement | null = null;
    let progress: HTMLInputElement | null = null;
    let announcer: HTMLElement | null = null;
    let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

    const ensureContainer = () => {
      if (container) return container;
      const host = document.createElement('div');
      host.className = 'media-core-controls';
      host.setAttribute('role', 'group');
      host.setAttribute('aria-label', 'Media controls');
      host.innerHTML = `
        <span class="media-core-visually-hidden" data-media-core-announcer role="status" aria-live="polite"></span>
        <span id="${sliderDescriptionId}" class="media-core-visually-hidden">Use left and right arrow keys to seek and up or down arrows to change volume.</span>
        <button class="media-core-button media-core-play" type="button" aria-pressed="false" aria-label="${labels.play}">${labels.play}</button>
        <input class="media-core-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Playback position" aria-describedby="${sliderDescriptionId}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 seconds played" />
        <button class="media-core-button media-core-mute" type="button" aria-pressed="false" aria-label="${labels.mute}">${labels.mute}</button>
        <div class="media-core-time" id="${timeLabelId}" role="status" aria-live="polite" aria-atomic="true"></div>
      `;
      container = host;
      announcer = host.querySelector('[data-media-core-announcer]') as HTMLElement | null;
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
      if (container && !keydownHandler) {
        keydownHandler = (event) => handleKeyboardShortcuts(event);
        container.addEventListener('keydown', keydownHandler);
      }
    };

    const updatePlayState = () => {
      if (!playButton) return;
      const isPaused = !player.element || !(player.element instanceof HTMLMediaElement) || player.element.paused;
      playButton.textContent = isPaused ? labels.play : labels.pause;
      playButton.setAttribute('aria-pressed', isPaused ? 'false' : 'true');
      playButton.setAttribute('aria-label', isPaused ? labels.play : labels.pause);
      announcer && (announcer.textContent = isPaused ? 'Paused' : 'Playing');
    };

    const updateMuteState = () => {
      if (!muteButton || !player.element || !(player.element instanceof HTMLMediaElement)) return;
      muteButton.textContent = player.element.muted ? labels.unmute : labels.mute;
      muteButton.setAttribute('aria-pressed', player.element.muted ? 'true' : 'false');
      muteButton.setAttribute('aria-label', player.element.muted ? labels.unmute : labels.mute);
    };

    const updateTime = () => {
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      if (timeLabel && options?.showTime !== false) {
        timeLabel.textContent = `${formatTime(current)} / ${duration ? formatTime(duration) : '--:--'}`;
      }
      if (progress && duration && duration > 0) {
        progress.value = ((current / duration) * 100).toString();
        progress.setAttribute('aria-valuenow', progress.value);
        progress.setAttribute(
          'aria-valuetext',
          `${formatTime(current)} of ${duration ? formatTime(duration) : 'unknown duration'} played`,
        );
      }
    };

    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!container || !container.contains(event.target as Node)) return;
      if (!player.element || !(player.element instanceof HTMLMediaElement)) return;
      const isRangeInput = event.target instanceof HTMLInputElement && event.target.type === 'range';
      switch (event.key) {
        case ' ':
        case 'Spacebar':
        case 'Enter': {
          if (event.target instanceof HTMLButtonElement) {
            return;
          }
          event.preventDefault();
          void player.togglePlayPause();
          break;
        }
        case 'ArrowRight':
        case 'ArrowLeft': {
          if (isRangeInput) return;
          const delta = event.key === 'ArrowRight' ? keyboardSeekStep : -keyboardSeekStep;
          event.preventDefault();
          const duration = player.getDuration() ?? 0;
          const nextTime = clamp(player.getCurrentTime() + delta, 0, duration || Number.POSITIVE_INFINITY);
          player.seekTo(nextTime);
          break;
        }
        case 'ArrowUp':
        case 'ArrowDown': {
          event.preventDefault();
          const delta = event.key === 'ArrowUp' ? keyboardVolumeStep : -keyboardVolumeStep;
          const nextVolume = clamp(player.getVolume() + delta, 0, 1);
          player.setVolume(nextVolume);
          if (nextVolume === 0) {
            player.setMuted(true);
          } else if (player.element.muted) {
            player.setMuted(false);
          }
          updateMuteState();
          break;
        }
        default:
          break;
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
      if (container && keydownHandler) {
        container.removeEventListener('keydown', keydownHandler);
      }
      if (container?.parentElement) {
        container.parentElement.removeChild(container);
      }
      container = null;
      playButton = null;
      muteButton = null;
      timeLabel = null;
      progress = null;
      announcer = null;
      keydownHandler = null;
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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(max)) {
    return Math.max(value, min);
  }
  return Math.min(Math.max(value, min), max);
}
