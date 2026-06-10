import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import CategoryCard from '../../components/CategoryCard/CategoryCard';
import ProductCard from '../../components/ProductCard/ProductCard';
import type { Category, Pagination, Product } from '../../types';
import styles from './Catalog.module.css';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const categoryId = searchParams.get('categoryId') || '';
  const categorySlug = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'new';
  const page = searchParams.get('page') || '1';

  const showCategoryGrid = !categoryId && !categorySlug && !search;

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    api.get<Category[]>('/categories')
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'));
  }, []);

  useEffect(() => {
    if (showCategoryGrid) {
      setLoading(false);
      setProducts([]);
      return;
    }

    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    else if (categorySlug) params.set('category', categorySlug);
    params.set('sort', sort);
    params.set('page', page);
    params.set('limit', '12');

    api.get<{ products: Product[]; pagination: Pagination }>(`/products?${params}`)
      .then((data) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить товары');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [categoryId, categorySlug, search, sort, page, showCategoryGrid]);

  const currentCategory = categories.find(
    (c) => c.id === categoryId || c.slug === categorySlug
  );

  const handleSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSearchParams({ search: trimmed });
  };

  const currentPage = parseInt(page, 10) || 1;
  const totalPages = pagination?.pages || 1;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
  };

  if (showCategoryGrid) {
    return (
      <div className={styles.catalog}>
        <div className={styles.catalogHeader}>
          <h1>Каталог</h1>
          <p>Выберите категорию</p>
        </div>

        <div className={styles.searchBar}>
          <input
            type="search"
            placeholder="Поиск товаров..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(searchInput);
            }}
          />
          <button
            type="button"
            className={styles.searchBtn}
            onClick={() => handleSearch(searchInput)}
          >
            Найти
          </button>
        </div>

        {categories.length === 0 ? (
          <div className={styles.emptyCatalog}>
            <h2>Каталог пока пуст</h2>
            <p>Категории добавляет продавец. Загляните позже!</p>
          </div>
        ) : (
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                slug={cat.slug}
                name={cat.name}
                image={cat.image}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.catalog}>
      <div className={styles.productsHeader}>
        <button className={styles.backBtn} onClick={() => setSearchParams({})}>
          ← Каталог
        </button>
        <h1>{currentCategory?.name || (search ? `Поиск: ${search}` : 'Товары')}</h1>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            p.set('sort', e.target.value);
            p.set('page', '1');
            setSearchParams(p);
          }}
        >
          <option value="new">По новизне</option>
          <option value="popular">По популярности</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
        </select>
      </div>

      {error && <div className={styles.empty}><p>{error}</p></div>}

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <p>Товаров пока нет</p>
          <span>В этой категории администратор ещё не добавил товары</span>
        </div>
      ) : (
        <>
          <div className={styles.productGrid}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onFavorite={toggleFavorite}
                isFavorite={isFavorite(p.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ←
              </button>
              <span className={styles.pageInfo}>
                {currentPage} из {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
