import { useEffect, useMemo, useState } from 'react';
import { api, formatPrice } from '../../services/api';
import type { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../types';
import styles from './Admin.module.css';
import orderStyles from './Orders.module.css';

const STATUSES = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

type StatusFilter = 'all' | (typeof STATUSES)[number];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'NEW', label: 'Новые' },
  { key: 'PROCESSING', label: 'В обработке' },
  { key: 'SHIPPED', label: 'Отправлены' },
  { key: 'DELIVERED', label: 'Завершённые' },
  { key: 'CANCELLED', label: 'Отменённые' },
];

const STATUS_CLASS: Record<Order['status'], string> = {
  NEW: orderStyles.statusNew,
  PROCESSING: orderStyles.statusProcessing,
  SHIPPED: orderStyles.statusShipped,
  DELIVERED: orderStyles.statusDelivered,
  CANCELLED: orderStyles.statusCancelled,
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get<{ orders: Order[] }>('/admin/orders?limit=200')
      .then((d) => setOrders(d.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: orders.length,
      NEW: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => { c[o.status] += 1; });
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const updateStatus = async (
    id: string,
    prevStatus: string,
    nextStatus: string,
    resetSelect: () => void
  ) => {
    if (prevStatus === nextStatus) return;

    if (nextStatus === 'CANCELLED') {
      const ok = window.confirm('Отменить заказ? Товары вернутся на склад.');
      if (!ok) {
        resetSelect();
        return;
      }
    }

    if (prevStatus === 'CANCELLED' && nextStatus !== 'CANCELLED') {
      const ok = window.confirm('Восстановить заказ? Товары снова спишутся со склада.');
      if (!ok) {
        resetSelect();
        return;
      }
    }

    try {
      await api.put(`/admin/orders/${id}/status`, { status: nextStatus });
      load();
    } catch (err) {
      resetSelect();
      alert(err instanceof Error ? err.message : 'Не удалось изменить статус');
    }
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.pageTitle}>Заказы</h1>
          <p className={styles.pageDesc}>Управление заказами по статусам</p>
        </div>
      </div>

      <div className={orderStyles.tabs}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${orderStyles.tab} ${filter === tab.key ? orderStyles.tabActive : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className={orderStyles.tabCount}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={orderStyles.empty}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className={orderStyles.empty}>
          <p>Нет заказов в этом разделе</p>
        </div>
      ) : (
        <div className={orderStyles.list}>
          {filtered.map((o) => (
            <article key={o.id} className={orderStyles.card}>
              <div className={orderStyles.cardHead}>
                <div>
                  <span className={orderStyles.orderId}>#{o.id.slice(-8).toUpperCase()}</span>
                  <time className={orderStyles.date}>
                    {new Date(o.createdAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <span className={`${orderStyles.statusBadge} ${STATUS_CLASS[o.status]}`}>
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>

              <div className={orderStyles.cardBody}>
                <div className={orderStyles.infoBlock}>
                  <span className={orderStyles.infoLabel}>Клиент</span>
                  <strong>{o.user?.name || 'Гость'}</strong>
                </div>
                <div className={orderStyles.infoBlock}>
                  <span className={orderStyles.infoLabel}>Телефон</span>
                  <a href={`tel:${o.phone}`} className={orderStyles.phoneLink}>{o.phone}</a>
                </div>
                <div className={`${orderStyles.infoBlock} ${orderStyles.infoWide}`}>
                  <span className={orderStyles.infoLabel}>Адрес</span>
                  <span>{o.address}</span>
                </div>
                {o.comment && (
                  <div className={`${orderStyles.infoBlock} ${orderStyles.infoWide}`}>
                    <span className={orderStyles.infoLabel}>Комментарий</span>
                    <span>{o.comment}</span>
                  </div>
                )}
              </div>

              {o.orderItems?.length > 0 && (
                <ul className={orderStyles.items}>
                  {o.orderItems.map((item) => (
                    <li key={item.id} className={orderStyles.item}>
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0].url} alt="" className={orderStyles.itemImg} />
                      )}
                      <div className={orderStyles.itemInfo}>
                        <span className={orderStyles.itemName}>{item.product.name}</span>
                        <span className={orderStyles.itemMeta}>
                          {item.quantity} шт.
                          {item.size ? ` · ${item.size}` : ''}
                          {item.color ? ` · ${item.color}` : ''}
                        </span>
                      </div>
                      <span className={orderStyles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={orderStyles.cardFoot}>
                <div className={orderStyles.total}>
                  <span>Итого</span>
                  <strong>{formatPrice(o.total)}</strong>
                </div>
                <div className={orderStyles.statusChange}>
                  <label htmlFor={`status-${o.id}`}>Статус</label>
                  <select
                    id={`status-${o.id}`}
                    className={orderStyles.statusSelect}
                    value={o.status}
                    onChange={(e) => {
                      const next = e.target.value;
                      updateStatus(o.id, o.status, next, () => { e.target.value = o.status; });
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
