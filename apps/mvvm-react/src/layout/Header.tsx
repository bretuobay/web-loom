import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { Link } from 'react-router-dom';
import { useSignal } from '../hooks/useSignal';

export const Header = () => {
  const navigation = useSignal(navigationViewModel.navigationList.items$);
  return (
    <header className="header">
      <Link to="/" className="header-item">
        Dashboard
      </Link>
      <nav className="flex-container">
        {navigation.map((item) => (
          <Link key={item.id} to={`/${item.id}`} className="header-item">
            <i className={`icon-${item.icon}`}></i> {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};
