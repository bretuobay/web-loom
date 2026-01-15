import { NavLink } from 'react-router-dom';
import type { ThemeMode } from '../providers/ThemeProvider';

interface NavItem {
  label: string;
  path: string;
}

export interface HeaderProps {
  navItems: NavItem[];
  onTaskBoardClick: () => void;
  onToggleTheme: () => void;
  theme: ThemeMode;
  currentUser?: { displayName: string; role: string };
  onLogout?: () => void;
  onProfileClick?: () => void;
}

export function Header({
  navItems,
  onTaskBoardClick,
  onToggleTheme,
  theme,
  currentUser,
  onLogout,
  onProfileClick
}: HeaderProps) {
  return (
    <header className="layout-header">
      <div className="layout-header__branding">
        <p className="layout-header__eyebrow">Web Loom · MVVM Demo</p>
        <h1>TaskFlow · Project Management</h1>
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
                Signed in as <strong>{currentUser.displayName}</strong> · {currentUser.role}
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
          <button
            type="button"
            className="layout-header__theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme mode"
          >
            {theme === 'light' ? 'Night mode' : 'Day mode'}
          </button>
          <button className="layout-header__cta" type="button" onClick={onTaskBoardClick}>
            Open Task Board
          </button>
        </div>
      </div>
    </header>
  );
}
