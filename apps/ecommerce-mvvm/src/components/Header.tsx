import { Link } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
  theme: 'light' | 'dark';
  onOpenCart: () => void;
  onOpenPalette: () => void;
  onToggleTheme: () => void;
}

export function Header({ cartCount, theme, onOpenCart, onOpenPalette, onToggleTheme }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <p className="brand-kicker">Web Loom Commerce</p>
        <h1>Loom Market</h1>
      </div>

      <nav className="header-nav">
        <Link to="/">Storefront</Link>
        <Link to="/checkout">Checkout</Link>
      </nav>

      <div className="header-actions">
        <button className="ghost-btn" type="button" onClick={onOpenPalette}>
          Command Menu
        </button>
        <button className="ghost-btn" type="button" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'} Theme
        </button>
        <button className="brand-btn" type="button" onClick={onOpenCart}>
          Cart ({cartCount})
        </button>
      </div>
    </header>
  );
}
