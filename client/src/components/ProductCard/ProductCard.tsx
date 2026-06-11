import { Link } from 'react-router-dom';
import { formatPrice, resolveMediaUrl } from '../../services/api';
import { getProductDisplayImage } from '../../config/variants';
import type { Product } from '../../types';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export default function ProductCard({ product, onFavorite, isFavorite }: Props) {
  const image = getProductDisplayImage(product);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className={styles.card}>
      <Link to={`/product/${product.slug}`} className={styles.imageWrap}>
        {image ? (
          <img src={resolveMediaUrl(image)} alt={product.name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.placeholder} />
        )}
        <div className={styles.badges}>
          {product.isNew && <span className={styles.badgeNew}>Новинка</span>}
          {product.isSale && discount > 0 && (
            <span className={styles.badgeSale}>-{discount}%</span>
          )}
        </div>
        {onFavorite && (
          <button
            className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteActive : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onFavorite(product.id);
            }}
            aria-label="Избранное"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </Link>
      <div className={styles.info}>
        <span className={styles.brand}>{product.brand.name}</span>
        <Link to={`/product/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        {product.colors.length > 0 && (
          <div className={styles.colorDots} aria-label="Доступные цвета">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.id}
                className={styles.colorDot}
                style={{ background: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
        {product.avgRating !== undefined && product.avgRating > 0 && (
          <div className={styles.rating}>
            <span className={styles.stars}>★ {product.avgRating}</span>
            <span className={styles.reviewCount}>({product.reviewCount})</span>
          </div>
        )}
      </div>
    </article>
  );
}
