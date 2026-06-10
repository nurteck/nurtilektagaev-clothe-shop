import { useEffect, useState } from 'react';
import { api, formatPrice } from '../../services/api';
import type { Banner, Category, Product } from '../../types';
import styles from './Admin.module.css';

export default function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ isActive: true, order: '0' });
  const [loadingProducts, setLoadingProducts] = useState(false);

  const load = () => api.get<Banner[]>('/admin/banners').then(setItems).catch(console.error);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (modal) {
      api.get<Category[]>('/admin/categories').then(setCategories).catch(console.error);
    }
  }, [modal]);

  useEffect(() => {
    if (!categoryId) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    api.get<{ products: Product[] }>(`/admin/products?limit=100&categoryId=${categoryId}`)
      .then((d) => setProducts(d.products))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, [categoryId]);

  const applyProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductId(product.id);
  };

  const openCreate = () => {
    setEditing(null);
    setCategoryId('');
    setProductId('');
    setSelectedProduct(null);
    setProducts([]);
    setForm({ isActive: true, order: String(items.length) });
    setModal(true);
  };

  const openEdit = async (b: Banner) => {
    setEditing(b.id);
    setForm({ isActive: b.isActive, order: String(b.order) });
    setProductId('');
    setSelectedProduct(null);
    setCategoryId('');
    setProducts([]);
    setModal(true);

    if (b.productId) {
      try {
        const allProducts = await api.get<{ products: Product[] }>(`/admin/products?limit=200`);
        const product = allProducts.products.find((p) => p.id === b.productId);
        if (product?.category?.id) {
          const catId = product.category.id;
          setCategoryId(catId);
          const catProducts = await api.get<{ products: Product[] }>(`/admin/products?limit=100&categoryId=${catId}`);
          setProducts(catProducts.products);
          setProductId(product.id);
          setSelectedProduct(product);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setProductId('');
    setSelectedProduct(null);
  };

  const handleProductChange = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) applyProduct(product);
    else {
      setProductId('');
      setSelectedProduct(null);
    }
  };

  const handleSubmit = async () => {
    if (!productId || !selectedProduct) {
      alert('Выберите категорию и товар');
      return;
    }

    const data = {
      productId,
      isActive: form.isActive,
      order: parseInt(form.order, 10) || 0,
    };

    try {
      if (editing) await api.put(`/admin/banners/${editing}`, data);
      else await api.post('/admin/banners', data);
      setModal(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось сохранить');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить баннер?')) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить баннер');
    }
  };

  const previewImage = selectedProduct?.images[0]?.url;
  const previewTitle = selectedProduct?.name || '';
  const previewSubtitle = selectedProduct
    ? selectedProduct.oldPrice
      ? `${formatPrice(selectedProduct.price)} вместо ${formatPrice(selectedProduct.oldPrice)}`
      : formatPrice(selectedProduct.price)
    : '';

  return (
    <div>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.pageTitle}>Акции и баннеры</h1>
          <p className={styles.pageDesc}>Выберите товар из каталога — он появится как баннер на главной</p>
        </div>
        <button className={styles.adminPrimaryBtn} onClick={openCreate}>+ Добавить баннер</button>
      </div>

      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>Товар</th><th>Активен</th><th>Порядок</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {b.image && (
                      <img src={b.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    )}
                    <span>{b.product?.name || b.title}</span>
                  </div>
                </td>
                <td>{b.isActive ? 'Да' : 'Нет'}</td>
                <td>{b.order}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(b)}>Изменить</button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(b.id)}>Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className={styles.modal} onClick={() => setModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Редактировать баннер' : 'Новый баннер'}</h2>
            <div className={styles.form}>
              <div className={styles.formRow}>
                <label>1. Категория</label>
                <select
                  className={styles.adminInput}
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <label>2. Товар</label>
                <select
                  className={styles.adminInput}
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  disabled={!categoryId || loadingProducts}
                >
                  <option value="">
                    {!categoryId
                      ? 'Сначала выберите категорию'
                      : loadingProducts
                        ? 'Загрузка...'
                        : products.length === 0
                          ? 'В категории нет товаров'
                          : 'Выберите товар'}
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className={styles.formRow}>
                  <label>Превью баннера</label>
                  <div style={{
                    display: 'flex',
                    gap: 14,
                    padding: 14,
                    background: '#F5F3FF',
                    borderRadius: 12,
                    border: '1px solid #DDD6FE',
                  }}>
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={previewTitle}
                        style={{ width: 80, height: 100, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 80,
                        height: 100,
                        borderRadius: 8,
                        background: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: '#9CA3AF',
                      }}>
                        Нет фото
                      </div>
                    )}
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>{previewTitle}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{previewSubtitle}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#7C3AED', marginTop: 6 }}>
                        Ссылка: /product/{selectedProduct.slug}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.formRow}>
                <label>Порядок показа</label>
                <input
                  className={styles.adminInput}
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>

              <label className={styles.adminCheckbox}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Показывать на главной
              </label>

              <div className={styles.formActions}>
                <button className={styles.adminPrimaryBtn} onClick={handleSubmit} disabled={!selectedProduct}>
                  Сохранить
                </button>
                <button className={styles.adminGhostBtn} onClick={() => setModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
