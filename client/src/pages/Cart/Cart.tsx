import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../../services/api';
import { useShop, checkStock, type LocalCartItem } from '../../context/ShopContext';
import Button from '../../components/Button/Button';
import type { Product } from '../../types';
import styles from './Cart.module.css';

interface CartLine extends LocalCartItem {
  product: Product;
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, pruneCart } = useShop();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cart.length === 0) {
      setLines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
      .finally(() => setLoading(false));
  }, [cart, pruneCart]);

  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const totalPieces = lines.reduce((sum, l) => sum + l.quantity, 0);

  const changeQty = async (line: CartLine, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(line.productId, line.size, line.color);
      return;
    }

    setError('');
    try {
      const available = await checkStock(line.productId, line.size);
      if (quantity > available) {
        setError(`«${line.product.name}»: доступно только ${available} шт.`);
        return;
      }
      updateCartQuantity(line.productId, quantity, line.size, line.color);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Корзина</h1>
      {error && <p className={styles.error}>{error}</p>}

      {lines.length === 0 ? (
        <div className={styles.empty}>
          <p>Корзина пуста</p>
          <Link to="/catalog"><Button>Перейти в каталог</Button></Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.items}>
            {lines.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className={styles.item}
              >
                <Link to={`/product/${item.product.slug}`} className={styles.itemImage}>
                  {item.product.images[0] && (
                    <img src={item.product.images[0].url} alt={item.product.name} />
                  )}
                </Link>
                <div className={styles.itemInfo}>
                  <Link to={`/product/${item.product.slug}`} className={styles.itemName}>
                    {item.product.name}
                  </Link>
                  <span className={styles.itemMeta}>
                    {item.size && `Размер: ${item.size}`}
                    {item.color && ` · Цвет: ${item.color}`}
                  </span>
                  <span className={styles.itemPrice}>{formatPrice(item.product.price)}</span>
                </div>
                <div className={styles.itemActions}>
                  <div className={styles.qty}>
                    <button onClick={() => changeQty(item, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQty(item, item.quantity + 1)}>+</button>
                  </div>
                  <button
                    className={styles.remove}
                    onClick={() => removeFromCart(item.productId, item.size, item.color)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h3>Итого</h3>
            <div className={styles.summaryRow}>
              <span>Товары ({totalPieces} шт.)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>К оплате</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Button size="lg" fullWidth onClick={() => navigate('/checkout')}>
              Оформить заказ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
