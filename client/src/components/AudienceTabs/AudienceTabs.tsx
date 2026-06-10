import type { ProductAudience } from '../../types';
import { AUDIENCE_OPTIONS } from '../../types';
import styles from './AudienceTabs.module.css';

interface Props {
  value: ProductAudience | '';
  onChange: (value: ProductAudience | '') => void;
}

export default function AudienceTabs({ value, onChange }: Props) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.tab} ${value === '' ? styles.active : ''}`}
        onClick={() => onChange('')}
      >
        Все
      </button>
      {AUDIENCE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.tab} ${value === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
