import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useObservable } from '../hooks/useObservable';
import type { UserData } from '@repo/models';
import { authViewModel } from '@repo/view-models/AuthViewModel';
import { ThemeToggle } from '../components/ThemeToggle';

export const Header = () => {
  const navigation = useObservable(navigationViewModel.navigationList.items$, []);
  const user = useObservable<UserData | null>(authViewModel.user$, null);
  const isAuthenticated = useObservable(authViewModel.isAuthenticated$, false);
  const isAuthLoading = useObservable(authViewModel.isLoading$, false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await authViewModel.signOutCommand.execute();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Unable to sign out', error);
    }
  };

  return (
    <header className="page-header navbar">
      <Link to="/" className="header-brand">
        <span>GreenHouse Monitor</span>
      </Link>

      <nav>
        <NavLink to="/" end className={({ isActive }) => `page-header-nav ${isActive ? 'active' : ''}`}>
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
        {isAuthenticated && (
          <div className="header-user">
            <span className="header-user-name">{user?.firstName || user?.email || 'Account'}</span>
            <button
              type="button"
              className="button btn-secondary header-user-signout"
              onClick={handleSignOut}
              disabled={isAuthLoading}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
