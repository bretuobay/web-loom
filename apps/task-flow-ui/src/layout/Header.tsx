import { NavLink } from 'react-router-dom';
import type { ThemeMode } from '../providers/ThemeProvider';

interface NavItem {
  label: string;
  path: string;
}

export interface HeaderProps {
  navItems: NavItem[];
  onToggleTheme: () => void;
  theme: ThemeMode;
  currentUser?: { displayName: string; role: string };
  onLogout?: () => void;
  onProfileClick?: () => void;
  onCommandPalette?: () => void;
}

export function Header({
  navItems,
  onToggleTheme,
  theme,
  currentUser,
  onLogout,
  onProfileClick,
  onCommandPalette,
}: HeaderProps) {
  return (
    <header className="layout-header">
      <div className="layout-header__branding">
        <p className="layout-header__eyebrow">Web Loom</p>
        <h1>TaskFlow </h1>
      </div>
      <div className="layout-header__actions">
        <nav className="layout-header__nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `layout-header__nav-link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="layout-header__controls">
          {currentUser ? (
            <div className="layout-header__user">
              <span>
                <strong>
                  {currentUser.displayName} ({currentUser.role})
                </strong>
              </span>
              <button className="layout-header__signout" type="button" onClick={onLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <NavLink className="layout-header__nav-link" to="/auth">
              Sign in / register
            </NavLink>
          )}
          {currentUser && onProfileClick && (
            <button className="layout-header__profile" type="button" onClick={onProfileClick}>
              Profile
            </button>
          )}
          {onCommandPalette && (
            <button
              type="button"
              className="layout-header__command-palette"
              onClick={onCommandPalette}
              aria-label="Open command palette"
              title="Command Palette (Ctrl+K)"
            >
              <span aria-hidden="true">⌘</span>
              <kbd>K</kbd>
            </button>
          )}
          <button
            type="button"
            className="layout-header__theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme mode"
          >
            {theme === 'light' ? 'Night mode' : 'Day mode'}
          </button>
        </div>
      </div>
    </header>
  );
}
