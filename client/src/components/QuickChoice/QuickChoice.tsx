import { Link } from 'react-router-dom';
import { QUICK_CHOICE_CARDS } from '../../config/quickChoice';
import styles from './QuickChoice.module.css';

export default function QuickChoice() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.label}>• ВЫБОР</span>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Быстрый выбор</h2>
          <span className={styles.line} />
        </div>
      </div>

      <div className={styles.grid}>
        {QUICK_CHOICE_CARDS.map((item) => (
          <Link key={item.id} to={item.link} className={styles.card}>
            <div className={styles.cardBody}>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>

              {item.promo && <span className={styles.promo}>{item.promo}</span>}

              {item.badgeText && (
                <span className={styles.badge}>
                  {item.badgeIcon && <span className={styles.badgeIcon}>{item.badgeIcon}</span>}
                  {item.badgeText}
                </span>
              )}

              <span className={styles.arrow} aria-hidden>→</span>
            </div>

            <div className={styles.imageWrap}>
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className={styles.image}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.add(styles.placeholderVisible);
                  }}
                />
              ) : null}
              <div className={`${styles.placeholder} ${!item.image ? styles.placeholderVisible : ''}`}>
                <span>Фото</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
