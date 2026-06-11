import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { api, formatPrice, resolveMediaUrl } from '../../services/api';
import { getProductDisplayImage } from '../../config/variants';

import { useShop } from '../../context/ShopContext';

import CategoryCard from '../../components/CategoryCard/CategoryCard';

import ProductCard from '../../components/ProductCard/ProductCard';

import QuickChoice from '../../components/QuickChoice/QuickChoice';

import type { Banner, Category, Product } from '../../types';

import styles from './Home.module.css';



export default function Home() {

  const { isFavorite, toggleFavorite } = useShop();

  const [saleProducts, setSaleProducts] = useState<Product[]>([]);

  const [newProducts, setNewProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [banners, setBanners] = useState<Banner[]>([]);

  const [activePromo, setActivePromo] = useState(0);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    Promise.all([

      api.get<Banner[]>('/banners').catch(() => []),

      api.get<{ products: Product[] }>('/products?isSale=true&limit=6').catch(() => ({ products: [] })),

      api.get<{ products: Product[] }>('/products?isNew=true&sort=new&limit=8').catch(() => ({ products: [] })),

      api.get<Category[]>('/categories').catch(() => []),

    ]).then(([bannerData, saleData, newData, cats]) => {

      setBanners(bannerData);

      setSaleProducts(saleData.products);

      setNewProducts(newData.products);

      setCategories(cats);

    }).finally(() => setLoading(false));

  }, []);



  const promos = banners.length > 0

    ? banners.map((b) => ({

        title: b.title,

        subtitle: b.subtitle || '',

        link: b.link || '/catalog',

        image: b.image,

      }))

    : saleProducts.slice(0, 3).map((p) => ({

        title: `Скидка на ${p.name}`,

        subtitle: `${formatPrice(p.price)}${p.oldPrice ? ` вместо ${formatPrice(p.oldPrice)}` : ''}`,

        link: `/product/${p.slug}`,

        image: getProductDisplayImage(p) || null,

      }));



  useEffect(() => {

    if (promos.length <= 1) return;

    const timer = setInterval(() => setActivePromo((p) => (p + 1) % promos.length), 5000);

    return () => clearInterval(timer);

  }, [promos.length]);



  if (loading) return <div className={styles.loading}>Загрузка...</div>;



  const hasContent = newProducts.length > 0 || categories.length > 0 || saleProducts.length > 0;

  const currentPromo = promos[activePromo];



  return (

    <div className={styles.home}>

      {currentPromo && (

        <section className={styles.hero}>

          {currentPromo.image ? (

            <div className={styles.heroMedia}>

              <img src={resolveMediaUrl(currentPromo.image)} alt="" className={styles.heroImg} loading="eager" />

            </div>

          ) : (

            <div className={styles.heroGradient} />

          )}

          <div className={styles.heroContent}>

            <span className={styles.heroTag}>Акция</span>

            <h2>{currentPromo.title}</h2>

            {currentPromo.subtitle && <p>{currentPromo.subtitle}</p>}

            <Link to={currentPromo.link} className={styles.heroBtn}>Смотреть</Link>

          </div>

          {promos.length > 1 && (

            <div className={styles.dots}>

              {promos.map((_, i) => (

                <button

                  key={i}

                  className={`${styles.dot} ${i === activePromo ? styles.dotActive : ''}`}

                  onClick={() => setActivePromo(i)}

                />

              ))}

            </div>

          )}

        </section>

      )}



      <QuickChoice />



      {newProducts.length > 0 && (

        <section className={styles.section}>

          <div className={styles.sectionHead}>

            <h2>Новинки</h2>

            <Link to="/feed?isNew=true">Все →</Link>

          </div>

          <div className={styles.productGrid}>

            {newProducts.map((p) => (

              <ProductCard key={p.id} product={p} onFavorite={toggleFavorite} isFavorite={isFavorite(p.id)} />

            ))}

          </div>

        </section>

      )}



      {saleProducts.length > 0 && (

        <section className={styles.section}>

          <div className={styles.sectionHead}>

            <h2>Скидки и акции</h2>

            <Link to="/feed?isSale=true">Все →</Link>

          </div>

          <div className={styles.productGrid}>

            {saleProducts.map((p) => (

              <ProductCard key={p.id} product={p} onFavorite={toggleFavorite} isFavorite={isFavorite(p.id)} />

            ))}

          </div>

        </section>

      )}



      {categories.length > 0 && (

        <section className={styles.section}>

          <div className={styles.sectionHead}>

            <h2>Категории</h2>

            <Link to="/catalog">Все →</Link>

          </div>

          <div className={styles.categoryGrid}>

            {categories.map((cat) => (

              <CategoryCard key={cat.id} id={cat.id} slug={cat.slug} name={cat.name} image={cat.image} />

            ))}

          </div>

        </section>

      )}



      {!hasContent && (

        <section className={styles.emptyShop}>

          <h2>Скоро появятся товары</h2>

          <p>Продавец готовит каталог — загляните чуть позже</p>

          <Link to="/catalog" className={styles.heroBtnPrimary}>Открыть каталог</Link>

        </section>

      )}

    </div>

  );

}

