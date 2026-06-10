import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import type { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../types';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, token, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [tab, setTab] = useState<'orders' | 'settings'>('orders');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (user) setName(user.name);
    api.get<Order[]>('/orders').then(setOrders).catch(console.error);
  }, [token, user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile({ name });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <div className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h1 className={styles.name}>{user.name}</h1>
          <p className={styles.email}>{user.email}</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={tab === 'orders' ? styles.tabActive : ''} onClick={() => setTab('orders')}>
          Заказы
        </button>
        <button className={tab === 'settings' ? styles.tabActive : ''} onClick={() => setTab('settings')}>
          Настройки
        </button>
        <Link to="/favorites" className={styles.favLink}>Избранное →</Link>
      </div>

      {tab === 'orders' && (
        <div className={styles.orders}>
          {orders.length === 0 ? (
            <p className={styles.empty}>У вас пока нет заказов</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className={styles.order}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderId}>Заказ #{order.id.slice(-8)}</span>
                  <span className={`${styles.status} ${styles[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className={styles.orderMeta}>
                  <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                  <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                </div>
                <div className={styles.orderItems}>
                  {order.orderItems.map((item) => (
                    <span key={item.id} className={styles.orderItem}>
                      {item.product.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className={styles.settings}>
          <div className={styles.field}>
            <label>Имя</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {saveError && <p className={styles.empty}>{saveError}</p>}
          <Button onClick={handleSave} loading={saving}>Сохранить</Button>
          <Button variant="danger" onClick={() => { logout(); navigate('/'); }}>
            Выйти из аккаунта
          </Button>
        </div>
      )}
    </div>
  );
}
