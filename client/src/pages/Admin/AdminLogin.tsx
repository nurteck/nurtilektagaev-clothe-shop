import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SellerLoginForm from '../../components/SellerLogin/SellerLoginForm';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <SellerLoginForm onSuccess={() => navigate('/admin', { replace: true })} />
        <Link to="/" className={styles.back}>← Вернуться в магазин</Link>
      </div>
    </div>
  );
}
