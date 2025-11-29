import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { Link, NavLink } from 'react-router-dom';
import { useObservable } from '../hooks/useObservable';
import { ThemeToggle } from '../components/ThemeToggle';

export const Header = () => {
  const navigation = useObservable(navigationViewModel.navigationList.items$, []);

  return (
    <header className="page-header navbar">
      <Link to="/" className="header-brand">
        <span>GreenHouse Monitor</span>
      </Link>

      <nav>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `page-header-nav ${isActive ? 'active' : ''}`}
        >
          Dashboard
        </NavLink>
        {navigation.map((item) => (
          <NavLink
            key={item.id}
            to={`/${item.id}`}
            className={({ isActive }) => `page-header-nav ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
};
