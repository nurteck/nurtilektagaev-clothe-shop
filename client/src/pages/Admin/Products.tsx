import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { api, formatPrice } from '../../services/api';
import type { Category, Pagination, Product, ProductAudience } from '../../types';
import { AUDIENCE_LABELS, AUDIENCE_OPTIONS } from '../../types';
import {
  defaultSizeRows,
  getSizePreset,
  mergeSizeRows,
  type SizePreset,
} from '../../config/sizes';
import styles from './Admin.module.css';

interface SizeRow {
  size: string;
  stock: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  categoryId: string;
  audience: ProductAudience | '';
  isPopular: boolean;
  isNew: boolean;
  images: string;
  sizes: SizeRow[];
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  oldPrice: '',
  categoryId: '',
  audience: '',
  isPopular: false,
  isNew: true,
  images: '',
  sizes: defaultSizeRows('clothing'),
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sizePreset, setSizePreset] = useState<SizePreset>('clothing');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.categoryId),
    [categories, form.categoryId]
  );

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
    });
    if (search.trim()) params.set('search', search.trim());
    if (categoryFilter) params.set('categoryId', categoryFilter);

    api.get<{ products: Product[]; pagination: Pagination }>(`/admin/products?${params}`)
      .then((d) => {
        setProducts(d.products);
        setPagination(d.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get<Category[]>('/admin/categories').then(setCategories).catch(console.error);
  }, []);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleCategoryFilter = (value: string) => {
    setPage(1);
    setCategoryFilter(value);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setForm((f) => ({ ...f, images: f.images ? `${f.images}\n${url}` : url }));
    } catch {
      alert('Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    if (categories.length === 0) {
      alert('Сначала создайте категорию в разделе «Категории»');
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setSizePreset('clothing');
    setError('');
    setModal(true);
  };

  const openEdit = (p: Product) => {
    const cat = categories.find((c) => c.id === p.category?.id) || p.category;
    const preset = getSizePreset(cat);
    const existingSizes = p.sizes.length
      ? p.sizes.map((s) => ({ size: s.size, stock: String(s.stock) }))
      : [{ size: 'M', stock: String(p.stock) }];

    setEditing(p.id);
    setSizePreset(preset);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      categoryId: p.category?.id || '',
      audience: p.audience || 'UNISEX',
      isPopular: p.isPopular,
      isNew: p.isNew,
      images: p.images.map((i) => i.url).join('\n'),
      sizes: mergeSizeRows(existingSizes, preset),
    });
    setError('');
    setModal(true);
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    const preset = getSizePreset(cat);
    setSizePreset(preset);
    setForm((f) => ({
      ...f,
      categoryId,
      sizes: editing ? mergeSizeRows(f.sizes, preset) : defaultSizeRows(preset),
    }));
  };

  const updateSize = (index: number, field: 'size' | 'stock', value: string) => {
    const sizes = [...form.sizes];
    sizes[index] = { ...sizes[index], [field]: value };
    setForm({ ...form, sizes });
  };

  const updateSizeStock = (index: number, value: string) => {
    updateSize(index, 'stock', value);
  };

  const addSize = () => setForm({ ...form, sizes: [...form.sizes, { size: '', stock: '0' }] });
  const removeSize = (index: number) => setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== index) });

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId || !form.audience) {
      setError('Заполните название, цену, категорию и раздел (мужское/женское/детское)');
      return;
    }

    const validSizes = form.sizes.filter((s) => s.size.trim());
    if (validSizes.length === 0) {
      setError('Укажите хотя бы один размер');
      return;
    }

    const sizesToSave = sizePreset === 'shoes'
      ? validSizes.filter((s) => parseInt(s.stock || '0', 10) > 0)
      : validSizes;

    const totalStock = sizesToSave.reduce((sum, s) => sum + parseInt(s.stock || '0', 10), 0);
    if (totalStock <= 0) {
      setError('Укажите количество хотя бы для одного размера');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || form.name,
      price: parseFloat(form.price),
      oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
      stock: totalStock,
      categoryId: form.categoryId,
      audience: form.audience,
      isNew: form.isNew,
      isPopular: form.isPopular,
      images: form.images.split('\n').filter(Boolean),
      sizes: sizesToSave.map((s) => ({
        size: s.size.trim(),
        stock: parseInt(s.stock || '0', 10),
      })),
      colors: [],
    };

    try {
      if (editing) await api.put(`/admin/products/${editing}`, payload);
      else await api.post('/admin/products', payload);
      setModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить товар');
    }
  };

  const isShoes = sizePreset === 'shoes';
  const totalPages = pagination?.pages || 1;
  const totalCount = pagination?.total ?? products.length;

  return (
    <div>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.pageTitle}>Товары</h1>
          <p className={styles.pageDesc}>Поиск по названию · фильтр по категории</p>
        </div>
        <button className={styles.adminPrimaryBtn} onClick={openCreate}>+ Добавить</button>
      </div>

      <div className={styles.productToolbar}>
        <div className={styles.productFilters}>
          <div className={styles.productSearchRow}>
            <input
              className={styles.productSearchInput}
              type="search"
              placeholder="Найти товар..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button type="button" className={styles.adminPrimaryBtn} onClick={handleSearch}>
              Найти
            </button>
          </div>
          <select
            className={styles.productFilterSelect}
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <p className={styles.productMeta}>
          {loading ? 'Загрузка...' : `Найдено: ${totalCount}`}
          {search && ` · «${search}»`}
        </p>
      </div>

      {!loading && products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{search || categoryFilter ? 'Ничего не найдено' : 'Товаров пока нет'}</p>
          <span>
            {search || categoryFilter
              ? 'Попробуйте другой запрос или сбросьте фильтр'
              : 'Сначала создайте категорию, затем добавьте товар'}
          </span>
          {(search || categoryFilter) ? (
            <button
              type="button"
              className={styles.adminGhostBtn}
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setCategoryFilter('');
                setPage(1);
              }}
            >
              Сбросить фильтры
            </button>
          ) : (
            <button className={styles.adminPrimaryBtn} onClick={openCreate}>Добавить товар</button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.productCards}>
            {products.map((p) => (
              <article key={p.id} className={styles.productCard}>
                {p.images[0] ? (
                  <img src={p.images[0].url} alt="" className={styles.productCardImg} />
                ) : (
                  <div className={styles.productCardImgPlaceholder} />
                )}
                <div className={styles.productCardBody}>
                  <div className={styles.productCardName}>{p.name}</div>
                  <div className={styles.productCardMeta}>
                    {p.category?.name} · {AUDIENCE_LABELS[p.audience] || '—'} · {p.stock} шт.
                    {p.isSale ? ' · Акция' : ''}
                  </div>
                  <div className={styles.productCardPrice}>{formatPrice(p.price)}</div>
                </div>
                <div className={styles.productCardActions}>
                  <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(p)}>
                    Изменить
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(p.id)}>
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.productTableWrap}>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Раздел</th>
                    <th>Цена</th>
                    <th>Акция</th>
                    <th>Остаток</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.category?.name}</td>
                      <td>{AUDIENCE_LABELS[p.audience] || '—'}</td>
                      <td>{formatPrice(p.price)}</td>
                      <td>{p.isSale ? 'Да' : '—'}</td>
                      <td>{p.stock} шт.</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(p)}>Изменить</button>
                          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(p.id)}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className={styles.productPagination}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
              <span>{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className={styles.modal} onClick={() => setModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Редактировать товар' : 'Новый товар'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setModal(false)}>×</button>
            </div>

            <div className={styles.form}>
              <div className={styles.formRow}>
                <label>Название *</label>
                <input className={styles.adminInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label>Описание</label>
                <textarea className={styles.adminInput} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className={styles.formRowGrid}>
                <div className={styles.formRow}>
                  <label>Цена (сом) *</label>
                  <input className={styles.adminInput} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className={styles.formRow}>
                  <label>Старая цена (акция)</label>
                  <input className={styles.adminInput} type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="Если больше цены — скидка" />
                </div>
              </div>
              <div className={styles.formRow}>
                <label>Категория *</label>
                <select className={styles.adminSelect} value={form.categoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
                  <option value="">Выберите</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>Для кого *</label>
                <div className={styles.audiencePicker}>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.audienceBtn} ${form.audience === opt.value ? styles.audienceBtnActive : ''}`}
                      onClick={() => setForm({ ...form, audience: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className={styles.adminCheckbox}>
                <input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} />
                Новинка (показывать в разделе «Новинки»)
              </label>
              <label className={styles.adminCheckbox}>
                <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
                Популярный товар (показывать на главной)
              </label>
              <div className={styles.formRow}>
                <label>Фото товара</label>
                <input type="file" accept="image/*" ref={fileRef} hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                <button type="button" className={styles.adminSecondaryBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Загрузка...' : 'Загрузить фото'}
                </button>
                <textarea className={styles.adminInput} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={2} style={{ marginTop: 8 }} />
              </div>
              <div className={styles.sizesSection}>
                <div className={styles.sizesHeader}>
                  <label>{isShoes ? 'Размеры обуви (EU) и количество *' : 'Размеры и количество *'}</label>
                  {!isShoes && (
                    <button type="button" className={styles.addSizeBtn} onClick={addSize}>+ Размер</button>
                  )}
                </div>
                <p className={styles.sizesHint}>
                  {isShoes
                    ? 'Категория обуви — укажите количество для размеров 36–43'
                    : 'Укажите размер (S, M, L…) и сколько штук в наличии'}
                  {selectedCategory && isShoes ? ` · «${selectedCategory.name}»` : ''}
                </p>

                {isShoes ? (
                  <div className={styles.sizeGrid}>
                    {form.sizes.map((s, i) => (
                      <div key={s.size} className={styles.sizeGridItem}>
                        <span className={styles.sizeLabel}>{s.size}</span>
                        <input
                          className={styles.adminInput}
                          type="number"
                          value={s.stock}
                          onChange={(e) => updateSizeStock(i, e.target.value)}
                          min="0"
                          placeholder="0"
                        />
                        <span className={styles.sizeUnit}>шт.</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.sizeList}>
                    {form.sizes.map((s, i) => (
                      <div key={i} className={styles.sizeRow}>
                        <input
                          className={styles.adminInput}
                          value={s.size}
                          onChange={(e) => updateSize(i, 'size', e.target.value)}
                          placeholder="S, M, L..."
                        />
                        <input
                          className={styles.adminInput}
                          type="number"
                          value={s.stock}
                          onChange={(e) => updateSize(i, 'stock', e.target.value)}
                          min="0"
                        />
                        <span className={styles.sizeUnit}>шт.</span>
                        {form.sizes.length > 1 && (
                          <button type="button" className={styles.removeSizeBtn} onClick={() => removeSize(i)}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {error && <p className={styles.formError}>{error}</p>}
              <div className={styles.formActions}>
                <button type="button" className={styles.adminPrimaryBtn} onClick={handleSubmit}>{editing ? 'Сохранить' : 'Опубликовать'}</button>
                <button type="button" className={styles.adminGhostBtn} onClick={() => setModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
