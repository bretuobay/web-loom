import type { ChapterMetadata, MediaPlugin } from '../types.js';
import './chapter-markers.css';

export interface ChapterMarkersOptions {
  className?: string;
  onSelectChapter?: (chapter: ChapterMetadata) => void;
}

export const chapterMarkersPlugin: MediaPlugin<ChapterMarkersOptions> = {
  name: 'chapter-markers',
  setup({ player, getMediaConfig, on, options }) {
    let container: HTMLElement | null = null;
    let list: HTMLElement | null = null;

    const ensureContainer = () => {
      if (container) return container;
      const wrapper = document.createElement('div');
      wrapper.className = `media-core-chapters${options?.className ? ` ${options.className}` : ''}`;
      list = document.createElement('div');
      wrapper.appendChild(list);
      container = wrapper;
      list.addEventListener('click', (event) => {
        const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-chapter-id]');
        if (!target) return;
        const chapters = getMediaConfig().chapters ?? [];
        const chapter = chapters.find((entry) => entry.id === target.dataset.chapterId);
        if (!chapter) return;
        player.seekTo(chapter.startTime);
        options?.onSelectChapter?.(chapter);
      });
      return wrapper;
    };

    const renderChapters = () => {
      if (!list || !container) return;
      const { chapters } = getMediaConfig();
      list.innerHTML = '';
      if (!chapters || !chapters.length) {
        container.hidden = true;
        return;
      }
      container.hidden = false;
      for (const chapter of chapters) {
        const entry = document.createElement('button');
        entry.type = 'button';
        entry.dataset.chapterId = chapter.id;
        entry.textContent = chapter.title;
        if (chapter.description) {
          entry.title = chapter.description;
        }
        list.appendChild(entry);
      }
    };

    const updateActiveChapter = (currentTime: number) => {
      if (!list) return;
      const chapters = getMediaConfig().chapters ?? [];
      if (!chapters.length) return;
      const activeIndex = chapters.findIndex((chapter, index) => {
        const next = chapters[index + 1];
        const end = chapter.endTime ?? next?.startTime ?? Number.POSITIVE_INFINITY;
        return currentTime >= chapter.startTime && currentTime < end;
      });
      const buttons = list.querySelectorAll<HTMLButtonElement>('button[data-chapter-id]');
      buttons.forEach((button, index) => {
        button.dataset.active = index === activeIndex ? 'true' : 'false';
      });
    };

    const mountCleanup = on('mount', ({ element }) => {
      const host = ensureContainer();
      if (!element.parentElement) {
        element.insertAdjacentElement('afterend', host);
      } else {
        element.parentElement.appendChild(host);
      }
      renderChapters();
    });

    const sourceCleanup = on('sourcechange', () => {
      renderChapters();
    });

    const timeCleanup = on('timeupdate', (snapshot) => {
      updateActiveChapter(snapshot.currentTime);
    });

    const disposeCleanup = on('dispose', () => {
      if (container?.parentElement) {
        container.parentElement.removeChild(container);
      }
      container = null;
      list = null;
    });

    return () => {
      mountCleanup();
      sourceCleanup();
      timeCleanup();
      disposeCleanup();
      if (container?.parentElement) {
        container.parentElement.removeChild(container);
      }
      container = null;
      list = null;
    };
  },
};
