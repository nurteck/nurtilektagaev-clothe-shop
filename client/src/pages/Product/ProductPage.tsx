import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice, getWhatsAppLink } from '../../services/api';
import { checkStock, useShop } from '../../context/ShopContext';
import Button from '../../components/Button/Button';
import type { Product } from '../../types';
import { AUDIENCE_LABELS } from '../../types';
import {
  firstAvailableSize,
  getProductSizesForDisplay,
  getStockForSize,
  isShoeProduct,
} from '../../config/sizes';
import { pluralizeReviews } from '../../utils/pluralize';
import styles from './ProductPage.module.css';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { cart, addToCart, toggleFavorite, isFavorite } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setProduct(null);
    setFetchError('');
    setMessage('');
    setQuantity(1);
    setActiveImage(0);
    setSelectedSize('');
    setSelectedColor('');

    api.get<Product>(`/products/${slug}`)
      .then((p) => {
        setProduct(p);
        setSelectedSize(firstAvailableSize(p));
        if (p.colors.length) setSelectedColor(p.colors[0].name);
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Не удалось загрузить товар');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const getMaxStock = (p: Product, size: string) => getStockForSize(p, size);

  const handleAddToCart = async () => {
    if (!product) return;

    const size = selectedSize || undefined;
    if (product.sizes.length > 0 && !size) {
      setMessage('Выберите размер');
      return;
    }

    setAdding(true);
    setMessage('');

    try {
      const available = await checkStock(product.id, size);
      const inCart = cart.find(
        (c) => c.productId === product.id && c.size === size && c.color === (selectedColor || undefined)
      );
      const totalQty = (inCart?.quantity ?? 0) + quantity;

      if (totalQty > available) {
        setMessage(`В наличии только ${available} шт.`);
        return;
      }

      addToCart({
        productId: product.id,
        quantity,
        size,
        color: selectedColor || undefined,
      });
      setMessage('Добавлено в корзину!');
    } catch {
      setMessage('Не удалось проверить наличие');
    } finally {
      setAdding(false);
    }
  };

  const handleFavorite = () => {
    if (!product) return;
    toggleFavorite(product.id);
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (fetchError) return <div className={styles.loading}>{fetchError}</div>;
  if (!product) return <div className={styles.loading}>Товар не найден</div>;

  const maxStock = getMaxStock(product, selectedSize);
  const displaySizes = getProductSizesForDisplay(product);
  const isShoes = isShoeProduct(product);
  const hasAnyStock = displaySizes.some((s) => s.stock > 0) || product.stock > 0;

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.breadcrumb}>
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/catalog">Каталог</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {product.images[activeImage] ? (
              <img src={product.images[activeImage].url} alt={product.name} />
            ) : (
              <div className={styles.placeholder} />
            )}
          </div>
          {product.images.length > 1 && (
            <div className={styles.thumbs}>
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.details}>
          <span className={styles.brand}>{product.brand.name}</span>
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.metaTags}>
            <span className={styles.category}>{product.category.name}</span>
            {product.audience && (
              <span className={styles.audience}>{AUDIENCE_LABELS[product.audience]}</span>
            )}
          </div>

          {product.avgRating !== undefined && product.avgRating > 0 && (
            <div className={styles.rating}>
              <span className={styles.stars}>★ {product.avgRating}</span>
              <span>({pluralizeReviews(product.reviewCount ?? 0)})</span>
            </div>
          )}

          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <>
                <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
                <span className={styles.discount}>-{discount}%</span>
              </>
            )}
          </div>

          <p className={styles.description}>{product.description}</p>

          {displaySizes.length > 0 && (
            <div className={styles.option}>
              <span className={styles.optionLabel}>{isShoes ? 'Размер (EU)' : 'Размер'}</span>
              <div className={styles.optionList}>
                {displaySizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.optionBtn} ${isShoes ? styles.shoeSizeBtn : ''} ${selectedSize === s.size ? styles.optionActive : ''}`}
                    onClick={() => { setSelectedSize(s.size); setQuantity(1); }}
                    disabled={s.stock === 0}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className={styles.option}>
              <span className={styles.optionLabel}>Цвет</span>
              <div className={styles.optionList}>
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.colorBtn} ${selectedColor === c.name ? styles.optionActive : ''}`}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                  >
                    <span style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className={styles.stock}>
            {maxStock > 0
              ? `В наличии${selectedSize ? ` (размер ${selectedSize})` : ''}: ${maxStock} шт.`
              : 'Нет в наличии'}
          </p>

          <div className={styles.quantity}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(maxStock, quantity + 1))} disabled={quantity >= maxStock}>+</button>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleAddToCart} loading={adding} size="lg" fullWidth disabled={!hasAnyStock || maxStock === 0}>
              В корзину
            </Button>
            <Button variant="outline" onClick={handleFavorite} size="lg">
              {product && isFavorite(product.id) ? '♥ В избранном' : '♡ В избранное'}
            </Button>
            <a
              href={getWhatsAppLink(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              Заказать через WhatsApp
            </a>
          </div>

          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>

      {product.reviews && product.reviews.length > 0 && (
        <section className={styles.reviews}>
          <h2>Отзывы ({product.reviews.length})</h2>
          <div className={styles.reviewList}>
            {product.reviews.map((r) => (
              <div key={r.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewAuthor}>{r.user.name}</span>
                  <span className={styles.reviewRating}>★ {r.rating}</span>
                </div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
