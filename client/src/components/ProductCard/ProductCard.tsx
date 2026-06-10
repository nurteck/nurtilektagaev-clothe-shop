import { Link } from 'react-router-dom';
import { formatPrice } from '../../services/api';
import type { Product } from '../../types';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export default function ProductCard({ product, onFavorite, isFavorite }: Props) {
  const image = product.images[0]?.url;
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className={styles.card}>
      <Link to={`/product/${product.slug}`} className={styles.imageWrap}>
        {image ? (
          <img src={image} alt={product.name} className={styles.image} loading="lazy" />
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
