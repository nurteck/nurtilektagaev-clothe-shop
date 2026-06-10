import { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import type { HomeNavCard } from '../../types';
import styles from './Admin.module.css';

export default function AdminHomeNav() {
  const [items, setItems] = useState<HomeNavCard[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<HomeNavCard | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('');
  const [promo, setPromo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.get<HomeNavCard[]>('/admin/home-nav').then(setItems).catch(console.error);

  useEffect(() => { load(); }, []);

  const openEdit = (card: HomeNavCard) => {
    setEditing(card);
    setTitle(card.title);
    setSubtitle(card.subtitle);
    setImage(card.image || '');
    setBadgeText(card.badgeText || '');
    setBadgeIcon(card.badgeIcon || '');
    setPromo(card.promo || '');
    setIsActive(card.isActive);
    setModal(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setImage(url);
    } catch {
      alert('Ошибка загрузки фото');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!editing) return;
    if (!title.trim()) return alert('Введите заголовок');

    try {
      await api.put(`/admin/home-nav/${editing.id}`, {
        title,
        subtitle,
        image: image || null,
        badgeText: badgeText || null,
        badgeIcon: badgeIcon || null,
        promo: promo || null,
        isActive,
      });
      setModal(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось сохранить');
    }
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.pageTitle}>Быстрый выбор</h1>
          <p className={styles.pageDesc}>
            Карточки на главной странице — загрузите фото и при необходимости измените текст
          </p>
        </div>
      </div>

      <div className={styles.categoryAdminGrid}>
        {items.map((card) => (
          <div key={card.id} className={styles.categoryAdminCard}>
            {card.image ? (
              <img src={card.image} alt={card.title} className={styles.categoryAdminImg} />
            ) : (
              <div className={styles.categoryAdminPlaceholder}>{card.title.charAt(0)}</div>
            )}
            <div className={styles.categoryAdminInfo}>
              <strong>{card.title}</strong>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{card.subtitle}</span>
              {!card.isActive && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Скрыта</span>}
              <div className={styles.actions}>
                <button
                  className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={() => openEdit(card)}
                >
                  Изменить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && editing && (
        <div className={styles.modal} onClick={() => setModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Карточка «{editing.title}»</h2>
            <div className={styles.form}>
              <div className={styles.formRow}>
                <label>Заголовок</label>
                <input className={styles.adminInput} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <label>Подзаголовок</label>
                <input className={styles.adminInput} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <label>Фото карточки</label>
                {image && <img src={image} alt="" className={styles.previewImg} />}
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
              <div className={styles.formRow}>
                <label>Бейдж (необязательно)</label>
                <input
                  className={styles.adminInput}
                  value={badgeIcon}
                  onChange={(e) => setBadgeIcon(e.target.value)}
                  placeholder="Иконка, например ❄"
                  style={{ marginBottom: 8 }}
                />
                <input
                  className={styles.adminInput}
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="Текст бейджа"
                />
              </div>
              <div className={styles.formRow}>
                <label>Промо-метка (необязательно, например -25%)</label>
                <input className={styles.adminInput} value={promo} onChange={(e) => setPromo(e.target.value)} />
              </div>
              <label className={styles.adminCheckbox}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Показывать на главной
              </label>
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
