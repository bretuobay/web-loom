import { useTheme } from '../providers/ThemeProvider';
import '../styles/ThemeToggle.css';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg
          className="theme-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-1.05zm-9.5 6.69A8.14 8.14 0 017.08 5.22v.27a10.15 10.15 0 0010.14 10.14 9.79 9.79 0 002.1-.22 8.11 8.11 0 01-7.18 4.32z" />
        </svg>
      ) : (
        <svg
          className="theme-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5.64 17l-.71.71a1 1 0 000 1.41 1 1 0 001.41 0l.71-.71A1 1 0 005.64 17zM5 12a1 1 0 00-1-1H3a1 1 0 000 2h1a1 1 0 001-1zm7-7a1 1 0 001-1V3a1 1 0 00-2 0v1a1 1 0 001 1zM5.64 7.05a1 1 0 00.7.29 1 1 0 00.71-.29 1 1 0 000-1.41l-.71-.71a1 1 0 00-1.41 1.41zm12 .29a1 1 0 00.7-.29l.71-.71a1 1 0 10-1.41-1.41l-.64.71a1 1 0 000 1.41 1 1 0 00.66.29zM21 11h-1a1 1 0 000 2h1a1 1 0 000-2zm-9 8a1 1 0 00-1 1v1a1 1 0 002 0v-1a1 1 0 00-1-1zm6.36-2A1 1 0 0017 18.36l.71.71a1 1 0 001.41 0 1 1 0 000-1.41zM12 6.5a5.5 5.5 0 105.5 5.5A5.51 5.51 0 0012 6.5zm0 9a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
        </svg>
      )}
      <span className="theme-label">{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
    </button>
  );
};
