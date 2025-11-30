'use client';

import { useState } from 'react';
import { BookSidebar } from './book-sidebar';
import { BookContent } from './book-content';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  section: string;
  content: string;
}

interface BookReaderProps {
  chapters: Chapter[];
}

export function BookReader({ chapters }: BookReaderProps) {
  const [activeChapter, setActiveChapter] = useState(chapters[0]?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentChapter = chapters.find((ch) => ch.id === activeChapter);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <BookSidebar
        chapters={chapters}
        activeChapter={activeChapter || ''}
        onChapterSelect={(id) => {
          setActiveChapter(id);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <BookContent chapter={currentChapter} />
    </div>
  );
}
