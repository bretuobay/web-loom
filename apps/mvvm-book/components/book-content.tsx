'use client';

import { ScrollArea } from './ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface BookContentProps {
  chapter?: Chapter;
}

export function BookContent({ chapter }: BookContentProps) {
  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a chapter to begin reading</p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <article className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-balance text-primary">{chapter.title}</h1>
          <div className="prose prose-lg">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';

                  return !inline && language ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        fontSize: '0.875rem',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {chapter.content}
            </ReactMarkdown>
          </div>
        </article>
      </ScrollArea>
    </main>
  );
}
