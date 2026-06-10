import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import type { Product } from '../../types';
import styles from './ProductGrid.module.css';

interface Props {
  products: Product[];
  onFavorite?: (productId: string) => void;
  favoriteIds?: Set<string>;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
}

export default function ProductGrid({
  products,
  onFavorite,
  favoriteIds,
  title,
  subtitle,
  viewAllLink,
}: Props) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      {(title || viewAllLink) && (
        <div className={styles.header}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className={styles.viewAll}>
              Смотреть все →
            </Link>
          )}
        </div>
      )}
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onFavorite={onFavorite}
            isFavorite={favoriteIds?.has(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
