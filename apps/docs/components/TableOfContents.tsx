'use client';

export function TableOfContents() {
  // This is a placeholder. In a real app, you'd generate this from the page's headings.
  const toc = [
    { id: 'introduction', level: 2, text: 'Introduction' },
    { id: 'getting-started', level: 2, text: 'Getting Started' },
    { id: 'installation', level: 3, text: 'Installation' },
    { id: 'usage', level: 3, text: 'Usage' },
    { id: 'api-reference', level: 2, text: 'API Reference' },
  ];

  return (
    <nav className="space-y-2">
      <p className="font-semibold">On this page</p>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
            <a
              href={`#${item.id}`}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
