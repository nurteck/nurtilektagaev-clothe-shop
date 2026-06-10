import { useEffect, useState } from 'react';
import { api, formatPrice } from '../../services/api';
import type { Product } from '../../types';
import styles from './Admin.module.css';

interface DashboardData {
  productsCount: number;
  ordersCount: number;
  usersCount: number;
  totalRevenue: number;
  revenueLast30: number;
  revenueToday: number;
  pendingOrders: number;
  popularProducts: Product[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (error || !data) return <div className={styles.loading}>{error || 'Нет данных'}</div>;

  return (
    <div>
      <h1 className={styles.pageTitle}>Обзор магазина</h1>
      <p className={styles.pageDesc}>Выручка считается только по доставленным заказам (оплата при получении)</p>

      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.statHighlight}`}>
          <div className={styles.statValue}>{formatPrice(data.totalRevenue)}</div>
          <div className={styles.statLabel}>Общая выручка</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatPrice(data.revenueToday)}</div>
          <div className={styles.statLabel}>Выручка сегодня</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatPrice(data.revenueLast30)}</div>
          <div className={styles.statLabel}>За 30 дней</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.ordersCount}</div>
          <div className={styles.statLabel}>Заказов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.pendingOrders}</div>
          <div className={styles.statLabel}>Ждут обработки</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.productsCount}</div>
          <div className={styles.statLabel}>Товаров</div>
        </div>
      </div>

      {data.popularProducts.length > 0 && (
        <>
          <h2 className={styles.subTitle}>Популярные товары</h2>
          <div className={styles.table}>
            <table>
              <thead>
                <tr><th>Товар</th><th>Категория</th><th>Цена</th></tr>
              </thead>
              <tbody>
                {data.popularProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.category?.name}</td>
                    <td>{formatPrice(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
