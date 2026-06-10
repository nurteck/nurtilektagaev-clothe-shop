import { Link } from 'react-router-dom';
import styles from './CategoryCard.module.css';

interface Props {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  audience?: string;
  className?: string;
}

export default function CategoryCard({ id, slug, name, image, audience, className }: Props) {
  const params = new URLSearchParams({ categoryId: id, category: slug });
  if (audience) params.set('audience', audience);

  return (
    <Link to={`/catalog?${params}`} className={`${styles.card} ${className || ''}`}>
      <div className={styles.imageArea}>
        {image ? (
          <img src={image} alt={name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>
            <span>{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className={styles.nameBar}>{name}</div>
    </Link>
  );
}
