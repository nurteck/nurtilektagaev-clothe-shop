import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, formatPrice } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import { formatPhoneInput, normalizePhone } from '../../utils/phone';
import Button from '../../components/Button/Button';
import type { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../types';
import styles from './Orders.module.css';

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orderIds, savedPhone, setSavedPhone } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [phone, setPhone] = useState(() => formatPhoneInput(savedPhone || '+996 '));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const newOrderId = searchParams.get('new');

  const loadOrders = () => {
    setLoading(true);
    setError('');

    const normalized = normalizePhone(phone) || normalizePhone(savedPhone);
    if (!normalized) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.set('phone', normalized);
    if (orderIds.length) params.set('ids', orderIds.join(','));

    api.get<Order[]>(`/orders/guest?${params}`)
      .then(setOrders)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы');
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPhone(formatPhoneInput(savedPhone || '+996 '));
  }, [savedPhone]);

  useEffect(() => {
    const normalized = normalizePhone(savedPhone);
    if (normalized) loadOrders();
    else setLoading(false);
  }, [orderIds.join(','), savedPhone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (normalized) setSavedPhone(normalized);
    loadOrders();
  };

  const dismissSuccess = () => {
    searchParams.delete('new');
    setSearchParams(searchParams);
  };

  const newOrder = newOrderId ? orders.find((o) => o.id === newOrderId) : null;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Мои заказы</h1>
      <p className={styles.subtitle}>История покупок по номеру телефона</p>

      {newOrderId && (
        <div className={styles.successBanner}>
          <div className={styles.successIcon}>✓</div>
          <div>
            <h2>Заказ оформлен!</h2>
            <p>Номер заказа: <strong>#{newOrderId.slice(-8)}</strong></p>
            {newOrder && <p>Сумма: <strong>{formatPrice(newOrder.total)}</strong></p>}
            <p className={styles.successHint}>Сохраните номер — по нему можно отследить статус</p>
          </div>
          <div className={styles.successActions}>
            <Link to="/catalog"><Button>Продолжить покупки</Button></Link>
            <button type="button" className={styles.dismissBtn} onClick={dismissSuccess}>Закрыть</button>
          </div>
        </div>
      )}

      <form className={styles.search} onSubmit={handleSearch}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          placeholder="+996 700 123 456"
        />
        <Button type="submit">Найти</Button>
      </form>

      {error && <p className={styles.empty}>{error}</p>}

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <p>Заказов пока нет</p>
          <span>Оформите заказ в корзине — он появится здесь автоматически</span>
          <Link to="/catalog"><Button>Перейти в каталог</Button></Link>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
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
              <p className={styles.address}>{order.address}</p>
              <p className={styles.phone}>{formatPhoneInput(order.phone)}</p>
              <div className={styles.items}>
                {order.orderItems.map((item) => (
                  <span key={item.id} className={styles.item}>
                    {item.product.name} × {item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
