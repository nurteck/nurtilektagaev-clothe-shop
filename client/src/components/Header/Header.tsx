import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import styles from './Header.module.css';

const TABS = [
  { path: '/', label: 'Главная', shortLabel: 'Главная', icon: 'home' },
  { path: '/feed', label: 'Лента', shortLabel: 'Лента', icon: 'feed' },
  { path: '/catalog', label: 'Каталог', shortLabel: 'Каталог', icon: 'catalog' },
  { path: '/favorites', label: 'Избранное', shortLabel: 'Избр.', icon: 'heart' },
  { path: '/cart', label: 'Корзина', shortLabel: 'Корзина', icon: 'cart' },
  { path: '/orders', label: 'Заказы', shortLabel: 'Заказы', icon: 'orders' },
];

function TabIcon({ type }: { type: string }) {
  const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  switch (type) {
    case 'home':
      return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case 'feed':
      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'catalog':
      return <svg {...props}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>;
    case 'heart':
      return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'cart':
      return <svg {...props}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
    case 'orders':
      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    default:
      return null;
  }
}

export default function Header() {
  const location = useLocation();
  const { cartCount } = useShop();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>O</span>
            <span className={styles.logoText}>shop</span>
          </Link>

          <nav className={styles.desktopTabs}>
            {TABS.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`${styles.tab} ${isActive(tab.path) ? styles.tabActive : ''}`}
              >
                <TabIcon type={tab.icon} />
                <span>{tab.label}</span>
                {tab.path === '/cart' && cartCount > 0 && (
                  <span className={styles.badge}>{cartCount}</span>
                )}
              </Link>
            ))}
          </nav>

          <Link to="/cart" className={styles.mobileCart}>
            <TabIcon type="cart" />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
        </div>
      </header>

      <nav className={styles.bottomNav} aria-label="Основная навигация">
        {TABS.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`${styles.bottomTab} ${isActive(tab.path) ? styles.bottomTabActive : ''}`}
          >
            <span className={styles.bottomIcon}>
              <TabIcon type={tab.icon} />
              {tab.path === '/cart' && cartCount > 0 && (
                <span className={styles.bottomBadge}>{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </span>
            <span className={styles.bottomLabel}>{tab.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
