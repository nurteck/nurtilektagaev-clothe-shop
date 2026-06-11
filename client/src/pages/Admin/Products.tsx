import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { api, formatPrice, resolveMediaUrl } from '../../services/api';
import type { Category, Pagination, Product, ProductAudience } from '../../types';
import { AUDIENCE_LABELS, AUDIENCE_OPTIONS } from '../../types';
import { getSizePreset, type SizePreset } from '../../config/sizes';
import {
  buildPayloadFromColorGroups,
  COLOR_PRESETS,
  colorGroupsFromProduct,
  defaultSizesForPreset,
  newColorGroup,
  noColorSizesFromProduct,
  type ColorGroup,
} from '../../config/variants';
import styles from './Admin.module.css';

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
  colorGroups: ColorGroup[];
  noColorSizes: { size: string; stock: string }[];
}

const emptyForm = (preset: SizePreset = 'clothing'): ProductForm => ({
  name: '',
  description: '',
  price: '',
  oldPrice: '',
  categoryId: '',
  audience: '',
  isPopular: false,
  isNew: true,
  images: '',
  colorGroups: [],
  noColorSizes: defaultSizesForPreset(preset),
});

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
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingColorIdx, setUploadingColorIdx] = useState<number | null>(null);
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

  const uploadFile = async (file: File): Promise<string> => {
    const { url } = await api.upload(file);
    return url;
  };

  const handleMainUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, images: f.images ? `${f.images}\n${url}` : url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const handleColorUpload = async (file: File, groupIndex: number) => {
    setUploadingColorIdx(groupIndex);
    try {
      const url = await uploadFile(file);
      const colorGroups = [...form.colorGroups];
      colorGroups[groupIndex] = { ...colorGroups[groupIndex], imageUrl: url };
      setForm({ ...form, colorGroups });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки фото');
    } finally {
      setUploadingColorIdx(null);
    }
  };

  const openCreate = () => {
    if (categories.length === 0) {
      alert('Сначала создайте категорию в разделе «Категории»');
      return;
    }
    setEditing(null);
    setForm(emptyForm());
    setSizePreset('clothing');
    setError('');
    setModal(true);
  };

  const openEdit = (p: Product) => {
    const cat = categories.find((c) => c.id === p.category?.id) || p.category;
    const preset = getSizePreset(cat);
    const groups = colorGroupsFromProduct(p, preset);

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
      colorGroups: groups,
      noColorSizes: groups.length ? defaultSizesForPreset(preset) : noColorSizesFromProduct(p, preset),
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
      noColorSizes: defaultSizesForPreset(preset),
      colorGroups: f.colorGroups.map((g) => ({
        ...g,
        sizes: defaultSizesForPreset(preset).map((s) => {
          const found = g.sizes.find((x) => x.size === s.size);
          return { size: s.size, stock: found?.stock ?? '0' };
        }),
      })),
    }));
  };

  const addColorGroup = (preset?: { name: string; hex: string }) => {
    const group = newColorGroup(sizePreset, preset);
    setForm({ ...form, colorGroups: [...form.colorGroups, group] });
  };

  const removeColorGroup = (index: number) => {
    setForm({ ...form, colorGroups: form.colorGroups.filter((_, i) => i !== index) });
  };

  const updateColorGroup = (index: number, patch: Partial<ColorGroup>) => {
    const colorGroups = [...form.colorGroups];
    colorGroups[index] = { ...colorGroups[index], ...patch };
    setForm({ ...form, colorGroups });
  };

  const updateColorGroupSize = (groupIndex: number, sizeIndex: number, stock: string) => {
    const colorGroups = [...form.colorGroups];
    const sizes = [...colorGroups[groupIndex].sizes];
    sizes[sizeIndex] = { ...sizes[sizeIndex], stock };
    colorGroups[groupIndex] = { ...colorGroups[groupIndex], sizes };
    setForm({ ...form, colorGroups });
  };

  const updateNoColorSize = (index: number, field: 'size' | 'stock', value: string) => {
    const noColorSizes = [...form.noColorSizes];
    noColorSizes[index] = { ...noColorSizes[index], [field]: value };
    setForm({ ...form, noColorSizes });
  };

  const addNoColorSize = () => {
    setForm({ ...form, noColorSizes: [...form.noColorSizes, { size: '', stock: '0' }] });
  };

  const removeNoColorSize = (index: number) => {
    if (form.noColorSizes.length <= 1) return;
    setForm({ ...form, noColorSizes: form.noColorSizes.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId || !form.audience) {
      setError('Заполните название, цену, категорию и раздел (мужское/женское/детское)');
      return;
    }

    if (form.colorGroups.length > 0) {
      const unnamed = form.colorGroups.some((g) => !g.name.trim());
      if (unnamed) {
        setError('Укажите название для каждого цвета');
        return;
      }
    }

    const { colors, variants } = buildPayloadFromColorGroups(form.colorGroups, form.noColorSizes);

    if (variants.length === 0) {
      setError(
        form.colorGroups.length
          ? 'Укажите количество хотя бы для одного размера в любом цвете'
          : 'Укажите количество хотя бы для одного размера'
      );
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || form.name,
      price: parseFloat(form.price),
      oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
      categoryId: form.categoryId,
      audience: form.audience,
      isNew: form.isNew,
      isPopular: form.isPopular,
      images: form.images.split('\n').filter(Boolean),
      colors,
      variants,
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

  const requestDelete = (product: Product) => {
    setDeleteError('');
    setDeleteTarget({ id: product.id, name: product.name });
  };

  const cancelDelete = () => {
    if (!deleting) setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      if (pagination) {
        setPagination({ ...pagination, total: Math.max(0, pagination.total - 1) });
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить товар');
    } finally {
      setDeleting(false);
    }
  };

  const isShoes = sizePreset === 'shoes';
  const useColors = form.colorGroups.length > 0;
  const totalPages = pagination?.pages || 1;
  const totalCount = pagination?.total ?? products.length;

  const mainImagePreviews = form.images.split('\n').filter(Boolean);

  return (
    <div>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.pageTitle}>Товары</h1>
          <p className={styles.pageDesc}>Поиск по названию · фильтр по категории</p>
        </div>
        <button className={styles.adminPrimaryBtn} onClick={openCreate}>+ Добавить</button>
      </div>

      {deleteError && <p className={styles.formError}>{deleteError}</p>}

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
                  <img src={resolveMediaUrl(p.images[0].url)} alt="" className={styles.productCardImg} />
                ) : p.colors[0]?.imageUrl ? (
                  <img src={resolveMediaUrl(p.colors[0].imageUrl)} alt="" className={styles.productCardImg} />
                ) : (
                  <div className={styles.productCardImgPlaceholder} />
                )}
                <div className={styles.productCardBody}>
                  <div className={styles.productCardName}>{p.name}</div>
                  <div className={styles.productCardMeta}>
                    {p.category?.name} · {AUDIENCE_LABELS[p.audience] || '—'} · {p.stock} шт.
                    {p.colors.length > 0 ? ` · ${p.colors.length} цв.` : ''}
                    {p.isSale ? ' · Акция' : ''}
                  </div>
                  <div className={styles.productCardPrice}>{formatPrice(p.price)}</div>
                </div>
                <div className={styles.productCardActions}>
                  <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(p)}>
                    Изменить
                  </button>
                  <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => requestDelete(p)}>
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
                          <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => requestDelete(p)}>Удалить</button>
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
          <div className={`${styles.modalContent} ${styles.modalContentWide}`} onClick={(e) => e.stopPropagation()}>
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
                  <label>Старая цена (скидка)</label>
                  <input className={styles.adminInput} type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="Например: 3500" />
                  <p className={styles.sizesHint}>Если старая цена выше обычной — товар попадёт на главный баннер и в раздел «Скидки»</p>
                </div>
              </div>
              <div className={styles.formRow}>
                <label>Категория *</label>
                <select className={styles.adminSelect} value={form.categoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
                  <option value="">Выберите</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {selectedCategory && (
                  <p className={styles.sizesHint}>
                    {isShoes ? 'Обувь: фиксированные размеры EU' : 'Одежда: размеры XS–XXL'}
                  </p>
                )}
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

              <div className={`${styles.sizesSection} ${styles.colorsBlock}`}>
                <div className={styles.sizesHeader}>
                  <label>Цвета товара</label>
                  <button type="button" className={styles.addSizeBtn} onClick={() => addColorGroup()}>
                    + Добавить цвет
                  </button>
                </div>
                <p className={styles.sizesHint}>
                  {useColors
                    ? 'Для каждого цвета загрузите фото — покупатель увидит миниатюры как в маркетплейсе. Укажите остатки по размерам.'
                    : 'Если товар в разных цветах — добавьте цвет и загрузите фото для каждого. Иначе укажите только размеры ниже.'}
                </p>

                <div className={styles.colorPresetRow}>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={styles.adminSecondaryBtn}
                      onClick={() => addColorGroup(preset)}
                      disabled={form.colorGroups.some((g) => g.name === preset.name)}
                    >
                      <span className={styles.colorPresetDot} style={{ background: preset.hex }} />
                      {preset.name}
                    </button>
                  ))}
                </div>

                {form.colorGroups.map((group, gi) => (
                  <div key={gi} className={styles.colorGroupCard}>
                    <div className={styles.colorGroupHeader}>
                      <span className={styles.colorGroupTitle}>Цвет {gi + 1}</span>
                      <button type="button" className={styles.removeSizeBtn} onClick={() => removeColorGroup(gi)}>×</button>
                    </div>

                    <div className={styles.colorGroupTop}>
                      <div className={styles.colorGroupPhoto}>
                        {group.imageUrl ? (
                          <img src={resolveMediaUrl(group.imageUrl)} alt="" />
                        ) : (
                          <div className={styles.colorGroupPhotoPlaceholder}>Фото</div>
                        )}
                        <label className={styles.adminSecondaryBtn} style={{ cursor: 'pointer', textAlign: 'center' }}>
                          {uploadingColorIdx === gi ? 'Загрузка...' : group.imageUrl ? 'Сменить фото' : 'Загрузить фото *'}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={uploadingColorIdx === gi}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleColorUpload(file, gi);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      <div className={styles.colorGroupFields}>
                        <input
                          className={styles.adminInput}
                          value={group.name}
                          onChange={(e) => updateColorGroup(gi, { name: e.target.value })}
                          placeholder="Название (Белый, Чёрный...)"
                        />
                        <div className={styles.colorPickerRow}>
                          <input
                            type="color"
                            value={group.hex}
                            onChange={(e) => updateColorGroup(gi, { hex: e.target.value })}
                          />
                          <span>{group.hex}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.colorGroupSizes}>
                      <span className={styles.colorGroupSizesLabel}>
                        {isShoes ? 'Количество по размерам (EU)' : 'Количество по размерам'}
                      </span>
                      <div className={`${styles.sizeGrid} ${isShoes ? styles.shoeSizeGrid : ''}`}>
                        {group.sizes.map((s, si) => (
                          <div key={s.size} className={styles.sizeGridItem}>
                            <span className={styles.sizeLabel}>{s.size}</span>
                            <input
                              className={styles.adminInput}
                              type="number"
                              min="0"
                              value={s.stock}
                              onChange={(e) => updateColorGroupSize(gi, si, e.target.value)}
                              placeholder="0"
                            />
                            <span className={styles.sizeUnit}>шт.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {!useColors && (
                  <div className={styles.sizesSection}>
                    <div className={styles.sizesHeader}>
                      <label>{isShoes ? 'Размеры обуви (EU) *' : 'Размеры и количество *'}</label>
                      {!isShoes && (
                        <button type="button" className={styles.addSizeBtn} onClick={addNoColorSize}>+ Размер</button>
                      )}
                    </div>
                    {isShoes ? (
                      <div className={`${styles.sizeGrid} ${styles.shoeSizeGrid}`}>
                        {form.noColorSizes.map((s, i) => (
                          <div key={s.size} className={styles.sizeGridItem}>
                            <span className={styles.sizeLabel}>{s.size}</span>
                            <input
                              className={styles.adminInput}
                              type="number"
                              value={s.stock}
                              onChange={(e) => updateNoColorSize(i, 'stock', e.target.value)}
                              min="0"
                              placeholder="0"
                            />
                            <span className={styles.sizeUnit}>шт.</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.sizeList}>
                        {form.noColorSizes.map((s, i) => (
                          <div key={i} className={styles.sizeRow}>
                            <input
                              className={styles.adminInput}
                              value={s.size}
                              onChange={(e) => updateNoColorSize(i, 'size', e.target.value)}
                              placeholder="S, M, L..."
                            />
                            <input
                              className={styles.adminInput}
                              type="number"
                              value={s.stock}
                              onChange={(e) => updateNoColorSize(i, 'stock', e.target.value)}
                              min="0"
                            />
                            <span className={styles.sizeUnit}>шт.</span>
                            {form.noColorSizes.length > 1 && (
                              <button type="button" className={styles.removeSizeBtn} onClick={() => removeNoColorSize(i)}>×</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.sizesSection}>
                <label>Дополнительные фото (необязательно)</label>
                <p className={styles.sizesHint}>Общая галерея товара. Основное фото для цвета — в карточке цвета выше.</p>
                <input type="file" accept="image/*" ref={fileRef} hidden onChange={(e) => e.target.files?.[0] && handleMainUpload(e.target.files[0])} />
                <button type="button" className={styles.adminSecondaryBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Загрузка...' : '+ Загрузить фото'}
                </button>
                {mainImagePreviews.length > 0 && (
                  <div className={styles.imagePreviewRow}>
                    {mainImagePreviews.map((url, i) => (
                      <img key={i} src={resolveMediaUrl(url)} alt="" className={styles.previewThumb} />
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

      {deleteTarget && (
        <div className={styles.modal} onClick={cancelDelete}>
          <div
            className={`${styles.modalContent} ${styles.confirmModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Удалить товар?</h3>
            <p>
              «{deleteTarget.name}» будет удалён без возможности восстановления.
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.adminGhostBtn}
                onClick={cancelDelete}
                disabled={deleting}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
