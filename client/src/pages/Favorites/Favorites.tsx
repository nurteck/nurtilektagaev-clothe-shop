import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { api } from '../../services/api';

import { useShop } from '../../context/ShopContext';

import ProductCard from '../../components/ProductCard/ProductCard';

import Button from '../../components/Button/Button';

import type { Product } from '../../types';

import styles from './Favorites.module.css';



export default function Favorites() {

  const { favoriteIds, toggleFavorite } = useShop();

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');



  useEffect(() => {

    const ids = [...favoriteIds];

    if (ids.length === 0) {

      setProducts([]);

      setLoading(false);

      return;

    }



    setLoading(true);
    setError('');

    api.get<Product[]>(`/products/by-ids?ids=${ids.join(',')}`)
      .then(setProducts)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить избранное');
        setProducts([]);
      })
      .finally(() => setLoading(false));

  }, [favoriteIds]);



  if (loading) return <div className={styles.loading}>Загрузка...</div>;



  return (

    <div className={`container ${styles.page}`}>

      <h1 className={styles.title}>Избранное</h1>
      {error ? (
        <p className={styles.empty}>{error}</p>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <p>Список избранного пуст</p>
          <Link to="/catalog"><Button>Перейти в каталог</Button></Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onFavorite={toggleFavorite}
              isFavorite
            />
          ))}
        </div>
      )}

    </div>

  );

}

