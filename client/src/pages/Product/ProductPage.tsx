import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice, getWhatsAppOrderLink, resolveMediaUrl } from '../../services/api';
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
import { getColorPreviewUrl, getProductGalleryUrls } from '../../config/variants';
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
  const colorStripRef = useRef<HTMLDivElement>(null);

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
        const initialColor = p.colors[0]?.name ?? '';
        setProduct(p);
        setSelectedColor(initialColor);
        setSelectedSize(firstAvailableSize(p, initialColor));
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Не удалось загрузить товар');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const selectColor = (colorName: string) => {
    if (!product) return;
    setSelectedColor(colorName);
    setSelectedSize(firstAvailableSize(product, colorName));
    setQuantity(1);
    setActiveImage(0);
  };

  const scrollColors = (direction: -1 | 1) => {
    const el = colorStripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 200, behavior: 'smooth' });
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const size = selectedSize || undefined;
    const color = selectedColor || undefined;

    if (product.variants.length > 0 && !size) {
      setMessage('Выберите размер');
      return;
    }
    if (product.colors.length > 0 && !color) {
      setMessage('Выберите цвет');
      return;
    }

    setAdding(true);
    setMessage('');

    try {
      const available = await checkStock(product.id, size, color);
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

  const handleWhatsAppOrder = () => {
    if (!product) return;

    if (product.variants.length > 0 && !selectedSize) {
      setMessage('Выберите размер');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setMessage('Выберите цвет');
      return;
    }

    setMessage('');
    const url = getWhatsAppOrderLink({
      name: product.name,
      slug: product.slug,
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      quantity,
      price: product.price * quantity,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (fetchError) return <div className={styles.loading}>{fetchError}</div>;
  if (!product) return <div className={styles.loading}>Товар не найден</div>;

  const maxStock = getStockForSize(product, selectedSize, selectedColor);
  const displaySizes = getProductSizesForDisplay(product, selectedColor);
  const isShoes = isShoeProduct(product);
  const galleryUrls = getProductGalleryUrls(product, selectedColor);
  const safeActiveImage = galleryUrls.length ? Math.min(activeImage, galleryUrls.length - 1) : 0;
  const hasAnyStock =
    product.variants.some((v) => v.stock > 0) ||
    displaySizes.some((s) => s.stock > 0) ||
    product.stock > 0;

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
            {galleryUrls[safeActiveImage] ? (
              <img src={resolveMediaUrl(galleryUrls[safeActiveImage])} alt={product.name} />
            ) : (
              <div className={styles.placeholder} />
            )}
          </div>
          {galleryUrls.length > 1 && (
            <div className={styles.thumbs}>
              {galleryUrls.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  className={`${styles.thumb} ${i === safeActiveImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={resolveMediaUrl(url)} alt="" />
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

          {product.colors.length > 0 && (
            <div className={styles.colorSection}>
              <div className={styles.colorSectionHead}>
                <span className={styles.colorSelectedName}>{selectedColor || 'Выберите цвет'}</span>
                {product.colors.length > 1 && (
                  <span className={styles.colorCount}>Все {product.colors.length}</span>
                )}
              </div>
              <div className={styles.colorStripWrap}>
                {product.colors.length > 4 && (
                  <button
                    type="button"
                    className={styles.colorScrollBtn}
                    onClick={() => scrollColors(-1)}
                    aria-label="Прокрутить назад"
                  >
                    ‹
                  </button>
                )}
                <div className={styles.colorStrip} ref={colorStripRef}>
                  {product.colors.map((c) => {
                    const preview = getColorPreviewUrl(product, c);
                    const isActive = selectedColor === c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.colorThumb} ${isActive ? styles.colorThumbActive : ''}`}
                        onClick={() => selectColor(c.name)}
                        title={c.name}
                      >
                        {preview ? (
                          <img src={resolveMediaUrl(preview)} alt={c.name} />
                        ) : (
                          <span className={styles.colorThumbSwatch} style={{ background: c.hex }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                {product.colors.length > 4 && (
                  <button
                    type="button"
                    className={styles.colorScrollBtn}
                    onClick={() => scrollColors(1)}
                    aria-label="Прокрутить вперёд"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>
          )}

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
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className={styles.description}>{product.description}</p>

          <p className={styles.stock}>
            {maxStock > 0
              ? `В наличии${selectedSize ? ` (размер ${selectedSize}${selectedColor ? `, ${selectedColor}` : ''})` : ''}: ${maxStock} шт.`
              : 'Нет в наличии'}
          </p>

          <div className={styles.quantity}>
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity(Math.min(maxStock, quantity + 1))} disabled={quantity >= maxStock}>+</button>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleAddToCart} loading={adding} size="lg" fullWidth disabled={!hasAnyStock || maxStock === 0}>
              В корзину
            </Button>
            <Button variant="outline" onClick={handleFavorite} size="lg">
              {product && isFavorite(product.id) ? '♥ В избранном' : '♡ В избранное'}
            </Button>
            <button
              type="button"
              className={styles.whatsappBtn}
              onClick={handleWhatsAppOrder}
              disabled={!hasAnyStock || maxStock === 0}
            >
              Заказать через WhatsApp
            </button>
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
