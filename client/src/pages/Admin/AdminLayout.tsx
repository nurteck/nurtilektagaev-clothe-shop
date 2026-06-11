import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Admin.module.css';

const NAV = [
  { path: '/admin', label: 'Обзор', exact: true },
  { path: '/admin/categories', label: 'Категории' },
  { path: '/admin/products', label: 'Товары' },
  { path: '/admin/orders', label: 'Заказы' },
];

export default function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (!isAdmin) return null;

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.adminBrand}>
          <span className={styles.adminBadge}>Панель продавца</span>
          <Link to="/admin" className={styles.logo}>
            <span className={styles.logoIcon}>O</span>
            <span>shop Admin</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item) ? styles.navActive : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.adminUser}>{user?.name}</span>
          <Link to="/" className={styles.backLink}>← Магазин</Link>
          <button type="button" className={styles.logoutLink} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <nav className={styles.mobileNav} aria-label="Разделы админки">
        {NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.mobileNavLink} ${isActive(item) ? styles.mobileNavActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className={styles.content}>
        <Outlet />
      </main>

      <footer className={styles.mobileAdminFooter}>
        <span className={styles.mobileAdminUser}>{user?.name}</span>
        <Link to="/" className={styles.mobileAdminShop}>Магазин</Link>
        <button type="button" className={styles.mobileAdminLogout} onClick={handleLogout}>
          Выйти
        </button>
      </footer>
    </div>
  );
}
