import { useEffect, useState, useRef } from 'react';

import { api, resolveMediaUrl } from '../../services/api';

import type { Category } from '../../types';

import styles from './Admin.module.css';



export default function AdminCategories() {

  const [items, setItems] = useState<Category[]>([]);

  const [modal, setModal] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);

  const [name, setName] = useState('');

  const [description, setDescription] = useState('');

  const [image, setImage] = useState('');

  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);



  const load = () => api.get<Category[]>('/admin/categories').then(setItems).catch(console.error);

  useEffect(() => { load(); }, []);



  const openCreate = () => {

    setEditing(null);

    setName('');

    setDescription('');

    setImage('');

    setModal(true);

  };



  const openEdit = (c: Category) => {

    setEditing(c.id);

    setName(c.name);

    setDescription(c.description || '');

    setImage(c.image || '');

    setModal(true);

  };



  const handleUpload = async (file: File) => {

    setUploading(true);

    try {

      const { url } = await api.upload(file);

      setImage(url);

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Ошибка загрузки фото');

    } finally {

      setUploading(false);

    }

  };



  const handleSubmit = async () => {

    if (!name.trim()) return alert('Введите название категории');

    const data = { name, description, image: image || null };

    try {

      if (editing) await api.put(`/admin/categories/${editing}`, data);

      else await api.post('/admin/categories', data);

      setModal(false);

      load();

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Не удалось сохранить категорию');

    }

  };



  const handleDelete = async (id: string) => {

    if (!confirm('Удалить категорию?')) return;

    try {

      await api.delete(`/admin/categories/${id}`);

      load();

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Не удалось удалить категорию');

    }

  };



  return (

    <div>

      <div className={styles.toolbar}>

        <div>

          <h1 className={styles.pageTitle}>Категории каталога</h1>

          <p className={styles.pageDesc}>Загрузите фото для каждой категории — оно появится в каталоге у покупателей</p>

        </div>

        <button className={styles.adminPrimaryBtn} onClick={openCreate}>+ Добавить категорию</button>

      </div>



      {items.length === 0 ? (

        <div className={styles.emptyState}>

          <p>Категорий пока нет</p>

          <span>Добавьте первую категорию — например «Футболки», «Джинсы», «Обувь»</span>

          <button className={styles.adminPrimaryBtn} onClick={openCreate}>Создать категорию</button>

        </div>

      ) : (

        <div className={styles.categoryAdminGrid}>

          {items.map((c) => (

            <div key={c.id} className={styles.categoryAdminCard}>

              {c.image ? (

                <img src={resolveMediaUrl(c.image)} alt={c.name} className={styles.categoryAdminImg} />

              ) : (

                <div className={styles.categoryAdminPlaceholder}>{c.name.charAt(0)}</div>

              )}

              <div className={styles.categoryAdminInfo}>

                <strong>{c.name}</strong>

                <div className={styles.actions}>

                  <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEdit(c)}>Изменить</button>

                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(c.id)}>Удалить</button>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}



      {modal && (

        <div className={styles.modal} onClick={() => setModal(false)}>

          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

            <h2>{editing ? 'Редактировать категорию' : 'Новая категория'}</h2>

            <div className={styles.form}>

              <div className={styles.formRow}>

                <label>Название *</label>

                <input className={styles.adminInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Футболки" />

              </div>

              <div className={styles.formRow}>

                <label>Описание</label>

                <textarea className={styles.adminInput} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

              </div>

              <div className={styles.formRow}>

                <label>Фото категории</label>

                {image && <img src={resolveMediaUrl(image)} alt="" className={styles.previewImg} />}

                <input

                  type="file"

                  accept="image/*"

                  ref={fileRef}

                  hidden

                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}

                />

                <button

                  type="button"

                  className={styles.adminSecondaryBtn}

                  onClick={() => fileRef.current?.click()}

                  disabled={uploading}

                >

                  {uploading ? 'Загрузка...' : 'Загрузить фото'}

                </button>

                <input

                  className={styles.adminInput}

                  value={image}

                  onChange={(e) => setImage(e.target.value)}

                  placeholder="или вставьте URL изображения"

                  style={{ marginTop: 8 }}

                />

              </div>

              <div className={styles.formActions}>

                <button className={styles.adminPrimaryBtn} onClick={handleSubmit}>Сохранить</button>

                <button className={styles.adminGhostBtn} onClick={() => setModal(false)}>Отмена</button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

