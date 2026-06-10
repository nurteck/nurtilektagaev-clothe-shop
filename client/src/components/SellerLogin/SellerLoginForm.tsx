import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import styles from './SellerLogin.module.css';

interface Props {
  onSuccess: () => void;
  compact?: boolean;
}

export default function SellerLoginForm({ onSuccess, compact }: Props) {
  const { sellerLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await sellerLogin(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный email или пароль');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={compact ? styles.formCompact : styles.form} onSubmit={handleSubmit}>
      {!compact && (
        <>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>O</span>
            <div>
              <strong>Oshop</strong>
              <span>Панель продавца</span>
            </div>
          </div>
          <h2 className={styles.title}>Вход для продавца</h2>
          <p className={styles.hint}>Только для владельца магазина. Покупателям регистрация не нужна.</p>
        </>
      )}

      <div className={styles.field}>
        <label>Email продавца</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@oshop.com"
          required
          autoComplete="username"
        />
      </div>
      <div className={styles.field}>
        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" fullWidth loading={submitting} size="lg">
        Войти в панель
      </Button>
    </form>
  );
}
