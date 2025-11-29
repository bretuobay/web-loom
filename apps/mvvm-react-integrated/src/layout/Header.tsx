import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { Link } from 'react-router-dom';
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
        <Link to="/" className="page-header-nav">
          Dashboard
        </Link>
        {navigation.map((item) => (
          <Link key={item.id} to={`/${item.id}`} className="page-header-nav">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
};
