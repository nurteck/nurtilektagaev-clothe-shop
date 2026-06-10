import { useEffect, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { api } from '../../services/api';

import { useShop } from '../../context/ShopContext';

import AudienceTabs from '../../components/AudienceTabs/AudienceTabs';

import ProductCard from '../../components/ProductCard/ProductCard';

import type { Product, ProductAudience } from '../../types';

import styles from './Feed.module.css';

type FeedMode = 'new' | 'sale' | 'popular' | 'default';

function getFeedMode(params: URLSearchParams): FeedMode {
  if (params.get('isNew') === 'true') return 'new';
  if (params.get('isSale') === 'true') return 'sale';
  if (params.get('sort') === 'popular') return 'popular';
  return 'default';
}

const FEED_TITLES: Record<FeedMode, { title: string; subtitle: string; empty: string }> = {
  new: {
    title: 'Новинки',
    subtitle: 'Только новые поступления',
    empty: 'Пока нет новинок — загляните позже',
  },
  sale: {
    title: 'Акции',
    subtitle: 'Товары со скидкой',
    empty: 'Сейчас нет товаров по акции',
  },
  popular: {
    title: 'Хиты',
    subtitle: 'Самые заказываемые товары',
    empty: 'Пока нет заказов — хиты появятся после первых покупок',
  },
  default: {
    title: 'Лента',
    subtitle: 'Товары, которые опубликовал продавец',
    empty: 'Товары появятся, когда продавец их добавит',
  },
};

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const audienceParam = searchParams.get('audience') || '';
  const audience = (['MEN', 'WOMEN', 'KIDS', 'UNISEX'].includes(audienceParam)
    ? audienceParam
    : '') as ProductAudience | '';

  const mode = getFeedMode(searchParams);
  const copy = FEED_TITLES[mode];

  useEffect(() => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ limit: '24' });

    if (audience) params.set('audience', audience);

    if (mode === 'new') {
      params.set('isNew', 'true');
      params.set('sort', 'new');
    } else if (mode === 'sale') {
      params.set('isSale', 'true');
      params.set('sort', 'new');
    } else if (mode === 'popular') {
      params.set('sort', 'popular');
      params.set('onlyOrdered', 'true');
    } else {
      params.set('sort', 'new');
    }

    api.get<{ products: Product[] }>(`/products?${params}`)
      .then((d) => setProducts(d.products))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить товары');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [audience, mode]);

  const setAudience = (value: ProductAudience | '') => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set('audience', value);
    else p.delete('audience');
    setSearchParams(p);
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.feed}>
      <div className={styles.header}>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>

      <AudienceTabs value={audience} onChange={setAudience} />

      {error ? (
        <div className={styles.empty}>
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <h2>Пусто</h2>
          <p>{audience ? 'Нет товаров в этом разделе' : copy.empty}</p>
          <Link to="/catalog">Перейти в каталог</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
