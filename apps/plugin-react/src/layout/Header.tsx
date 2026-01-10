import { Link } from '../router/Routing';
import { usePluginMenuItems } from '../host/PluginHost';

export const Header = () => {
  const navigation = usePluginMenuItems();
  return (
    <header className="header">
      <Link to="/" className="header-item">
        Dashboard
      </Link>
      <nav className="flex-container">
        {navigation.map((item) => (
          <Link key={item.path} to={item.path} className="header-item">
            <i className={`icon-${item.icon}`}></i> {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};
