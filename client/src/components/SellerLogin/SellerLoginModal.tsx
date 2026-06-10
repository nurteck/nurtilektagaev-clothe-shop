import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLoginForm from './SellerLoginForm';
import styles from './SellerLogin.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SellerLoginModal({ open, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-login-title"
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="seller-login-title" className={styles.modalTitle}>Вход для продавца</h2>
        <p className={styles.modalHint}>Закрытое окно — только для управления магазином</p>
        <SellerLoginForm
          compact
          onSuccess={() => {
            onClose();
            navigate('/admin');
          }}
        />
      </div>
    </div>
  );
}
