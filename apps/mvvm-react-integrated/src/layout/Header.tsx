import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { Link } from 'react-router-dom';
import { useObservable } from '../hooks/useObservable';

export const Header = () => {
  const navigation = useObservable(navigationViewModel.navigationList.items$, []);
  return (
    <header className="page-header navbar">
      <Link to="/" className="page-header-nav">
        Dashboard
      </Link>
      <nav className="flex-container">
        {navigation.map((item) => (
          <Link key={item.id} to={`/${item.id}`} className="page-header-nav">
            <i className={`icon-${item.icon}`}></i> {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};
