import { useState } from 'react';
import { getWhatsAppUrl, WHATSAPP_PHONE_DISPLAY } from '../../config/contact';
import SellerLoginModal from '../SellerLogin/SellerLoginModal';
import styles from './Footer.module.css';

const FEATURES = [
  { icon: '🚚', title: 'Доставка', text: 'По всему Кыргызстану' },
  { icon: '💳', title: 'Оплата', text: 'При получении заказа' },
  { icon: '💬', title: 'Поддержка', text: 'Ответим в WhatsApp' },
];

export default function Footer() {
  const [sellerModalOpen, setSellerModalOpen] = useState(false);

  return (
    <>
      <footer className={styles.footer}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>O</span>
              <span className={styles.logoText}>shop</span>
            </div>
            <p className={styles.tagline}>
              Одежда, обувь и аксессуары с доставкой по Кыргызстану
            </p>
            <p className={styles.hours}>Ежедневно · 10:00 — 20:00</p>
          </div>

          <div className={styles.features}>
            <h3 className={styles.blockTitle}>Почему Oshop</h3>
            <ul className={styles.featureList}>
              {FEATURES.map((f) => (
                <li key={f.title} className={styles.featureItem}>
                  <span className={styles.featureIcon} aria-hidden>{f.icon}</span>
                  <div>
                    <strong>{f.title}</strong>
                    <span>{f.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.contacts}>
            <a
              href={getWhatsAppUrl('Здравствуйте! Хочу сделать заказ в Oshop')}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              Написать в WhatsApp
            </a>
            <div className={styles.contactList}>
              <a href={`tel:${WHATSAPP_PHONE_DISPLAY.replace(/\s/g, '')}`} className={styles.contactRow}>
                <span className={styles.contactLabel}>Телефон</span>
                <span>{WHATSAPP_PHONE_DISPLAY}</span>
              </a>
              <a href="mailto:info@oshop.kg" className={styles.contactRow}>
                <span className={styles.contactLabel}>Email</span>
                <span>info@oshop.kg</span>
              </a>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Адрес</span>
                <span>Бишкек, Кыргызстан</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.sellerLink}
              onClick={() => setSellerModalOpen(true)}
            >
              Вход для продавца →
            </button>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} Oshop KG · Мода в Кыргызстане</p>
        </div>
      </footer>

      <SellerLoginModal open={sellerModalOpen} onClose={() => setSellerModalOpen(false)} />
    </>
  );
}
