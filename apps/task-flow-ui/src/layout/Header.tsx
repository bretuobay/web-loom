import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
}

export interface HeaderProps {
  navItems: NavItem[];
  onTaskBoardClick: () => void;
}

export function Header({ navItems, onTaskBoardClick }: HeaderProps) {
  return (
    <header className="layout-header">
      <div className="layout-header__content">
        <p className="layout-header__eyebrow">Web Loom · MVVM Demo</p>
        <h1>TaskFlow · Project Management</h1>
        <p>
          Real-time inspired experience built on Web Loom ViewModels, plugin registry, reactive state,
          and lightweight routing.
        </p>
      </div>
      <div className="layout-header__actions">
        <nav className="layout-header__nav" aria-label="TaskFlow navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `layout-header__nav-link ${isActive ? 'is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink className="layout-header__nav-link" to="/auth">
            Sign in / register
          </NavLink>
        </nav>
        <button className="layout-header__cta" type="button" onClick={onTaskBoardClick}>
          Open Task Board
        </button>
      </div>
    </header>
  );
}
