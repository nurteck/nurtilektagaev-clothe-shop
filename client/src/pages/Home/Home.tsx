import { useEffect, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { api, formatPrice, resolveMediaUrl } from '../../services/api';
import { getProductDisplayImage } from '../../config/variants';

import { useShop } from '../../context/ShopContext';

import CategoryCard from '../../components/CategoryCard/CategoryCard';

import ProductCard from '../../components/ProductCard/ProductCard';

import QuickChoice from '../../components/QuickChoice/QuickChoice';

import type { Category, Product } from '../../types';

import styles from './Home.module.css';

interface HeroSlide {
  id: string;
  title: string;
  link: string;
  image: string;
  discount: number;
  salePrice: string;
  oldPrice?: string;
}

function productToHeroSlide(p: Product): HeroSlide | null {
  const image = getProductDisplayImage(p);
  if (!image || !p.oldPrice || p.oldPrice <= p.price) return null;

  return {
    id: p.id,
    title: p.name,
    link: `/product/${p.slug}`,
    image,
    discount: Math.round((1 - p.price / p.oldPrice) * 100),
    salePrice: formatPrice(p.price),
    oldPrice: formatPrice(p.oldPrice),
  };
}

export default function Home() {

  const { isFavorite, toggleFavorite } = useShop();

  const [saleProducts, setSaleProducts] = useState<Product[]>([]);

  const [newProducts, setNewProducts] = useState<Product[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [activeSlide, setActiveSlide] = useState(0);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    Promise.all([

      api.get<{ products: Product[] }>('/products?isSale=true&limit=12').catch(() => ({ products: [] })),

      api.get<{ products: Product[] }>('/products?isNew=true&sort=new&limit=8').catch(() => ({ products: [] })),

      api.get<Category[]>('/categories').catch(() => []),

    ]).then(([saleData, newData, cats]) => {

      setSaleProducts(saleData.products);

      setNewProducts(newData.products);

      setCategories(cats);

    }).finally(() => setLoading(false));

  }, []);



  const heroSlides = useMemo(
    () => saleProducts.map(productToHeroSlide).filter((s): s is HeroSlide => s !== null),
    [saleProducts],
  );



  useEffect(() => {

    if (heroSlides.length <= 1) return;

    const timer = setInterval(() => setActiveSlide((i) => (i + 1) % heroSlides.length), 5000);

    return () => clearInterval(timer);

  }, [heroSlides.length]);



  useEffect(() => {

    if (activeSlide >= heroSlides.length) setActiveSlide(0);

  }, [activeSlide, heroSlides.length]);



  if (loading) return <div className={styles.loading}>Загрузка...</div>;



  const hasContent = newProducts.length > 0 || categories.length > 0 || saleProducts.length > 0;

  const currentSlide = heroSlides[activeSlide];



  return (

    <div className={styles.home}>

      {currentSlide && (

        <section className={styles.hero}>
          <div className={styles.heroBg} aria-hidden />

          <div className={styles.heroInner}>
            <div key={currentSlide.id} className={`${styles.heroContent} ${styles.heroSlide}`}>
              <div className={styles.heroBadges}>
                <span className={styles.heroTag}>Скидка</span>
                {currentSlide.discount > 0 && (
                  <span className={styles.heroDiscountBadge}>−{currentSlide.discount}%</span>
                )}
              </div>

              <h2 className={styles.heroTitle}>{currentSlide.title}</h2>

              <div className={styles.heroPrices}>
                <span className={styles.heroPriceNew}>{currentSlide.salePrice}</span>
                {currentSlide.oldPrice && (
                  <span className={styles.heroPriceOld}>{currentSlide.oldPrice}</span>
                )}
              </div>

              <Link to={currentSlide.link} className={styles.heroBtn}>
                Смотреть товар →
              </Link>
            </div>

            <div className={styles.heroMedia}>
              <div key={currentSlide.id} className={`${styles.heroImgFrame} ${styles.heroSlide}`}>
                <img
                  src={resolveMediaUrl(currentSlide.image)}
                  alt=""
                  className={styles.heroImg}
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {heroSlides.length > 1 && (

            <div className={styles.dots}>

              {heroSlides.map((slide, i) => (

                <button

                  key={slide.id}

                  type="button"

                  aria-label={`Слайд ${i + 1}`}

                  className={`${styles.dot} ${i === activeSlide ? styles.dotActive : ''}`}

                  onClick={() => setActiveSlide(i)}

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

