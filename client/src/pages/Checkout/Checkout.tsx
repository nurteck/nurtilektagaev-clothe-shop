import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatPrice, resolveMediaUrl } from '../../services/api';
import { getProductDisplayImage } from '../../config/variants';
import { checkStock, useShop, type LocalCartItem } from '../../context/ShopContext';
import { formatPhoneInput, normalizePhone } from '../../utils/phone';
import Button from '../../components/Button/Button';
import type { Product } from '../../types';
import { DELIVERY_REGIONS } from '../../config/delivery';
import styles from './Checkout.module.css';

interface CartLine extends LocalCartItem {
  product: Product;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, addOrderId, setSavedPhone, savedPhone, pruneCart } = useShop();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [city, setCity] = useState<string>(DELIVERY_REGIONS[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(() => formatPhoneInput(savedPhone || '+996 '));
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cart.length === 0) {
      setLines([]);
      setLoadingCart(false);
      return;
    }

    setLoadingCart(true);
    setError('');
    const ids = [...new Set(cart.map((c) => c.productId))].join(',');

    api.get<Product[]>(`/products/by-ids?ids=${ids}`)
      .then((products) => {
        const map = new Map(products.map((p) => [p.id, p]));
        const validIds = new Set(products.map((p) => p.id));
        if (cart.some((c) => !validIds.has(c.productId))) {
          pruneCart(validIds);
        }
        setLines(
          cart
            .filter((item) => map.has(item.productId))
            .map((item) => ({ ...item, product: map.get(item.productId)! }))
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить корзину');
        setLines([]);
      })
      .finally(() => setLoadingCart(false));
  }, [cart, pruneCart]);

  useEffect(() => {
    if (!loadingCart && cart.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [loadingCart, cart.length, navigate]);

  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || lines.length === 0) return;

    const normalized = normalizePhone(phone);
    if (!address.trim()) {
      setError('Укажите адрес доставки');
      return;
    }
    if (!normalized) {
      setError('Укажите корректный телефон: +996 XXX XXX XXX');
      return;
    }

    setLoading(true);
    setError('');

    try {
      for (const item of lines) {
        const available = await checkStock(item.productId, item.size, item.color);
        if (item.quantity > available) {
          setError(`«${item.product.name}»: доступно только ${available} шт.`);
          setLoading(false);
          return;
        }
      }

      const fullAddress = `${city}, ${address}`;
      const order = await api.post<{ id: string; total: number; phone: string }>('/orders/guest', {
        address: fullAddress,
        phone: normalized,
        comment,
        items: lines.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color || undefined,
        })),
      });

      addOrderId(order.id);
      setSavedPhone(normalized);
      clearCart();
      navigate(`/orders?new=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка оформления');
      setLoading(false);
    }
  };

  if (loadingCart) return <div className={styles.loading}>Загрузка...</div>;
  if (lines.length === 0) return null;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Оформление заказа</h1>
      <p className={styles.subtitle}>Доставка по Кыргызстану · без регистрации</p>

      <div className={styles.layout}>
        <aside className={styles.summary}>
          <h2>Ваш заказ</h2>
          <ul className={styles.items}>
            {lines.map((line) => (
              <li key={`${line.productId}-${line.size}-${line.color}`} className={styles.item}>
                {getProductDisplayImage(line.product, line.color || '') && (
                  <img
                    src={resolveMediaUrl(getProductDisplayImage(line.product, line.color || ''))}
                    alt=""
                    className={styles.itemImg}
                  />
                )}
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{line.product.name}</span>
                  {line.size && <span className={styles.itemMeta}>Размер: {line.size}</span>}
                  <span className={styles.itemQty}>{line.quantity} × {formatPrice(line.product.price)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.totalRow}>
            <span>Итого</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <div className={styles.paymentNote}>
            <strong>Оплата при получении</strong>
            <span>Наличными или картой курьеру</span>
          </div>
        </aside>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Регион / город</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {DELIVERY_REGIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Адрес доставки *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Улица, дом, квартира"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Телефон *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="+996 700 123 456"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Пожелания к заказу..."
              rows={3}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" size="lg" fullWidth loading={loading} disabled={loading}>
            Подтвердить заказ
          </Button>
        </form>
      </div>
    </div>
  );
}
