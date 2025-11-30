'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface Chapter {
  id: string;
  title: string;
  section?: string;
}

interface BookSidebarProps {
  chapters: Chapter[];
  activeChapter: string;
  onChapterSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BookSidebar({ chapters, activeChapter, onChapterSelect, isOpen, onClose }: BookSidebarProps) {
  // Group chapters by section
  const groupedChapters = chapters.reduce(
    (acc, chapter) => {
      const section = chapter.section || 'Introduction';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(chapter);
      return acc;
    },
    {} as Record<string, Chapter[]>,
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-primary">MVVM Book</h1>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Chapters list */}
          <ScrollArea className="h-0 min-h-0 flex-1 px-4 py-4">
            {Object.entries(groupedChapters).map(([section, sectionChapters]) => (
              <div key={section} className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">
                  {section}
                </h3>
                <div className="space-y-1">
                  {sectionChapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => onChapterSelect(chapter.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        activeChapter === chapter.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                      )}
                    >
                      {chapter.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
