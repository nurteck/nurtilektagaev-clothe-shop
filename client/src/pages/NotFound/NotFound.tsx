import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>Страница не найдена</h2>
      <p className={styles.text}>Возможно, ссылка устарела или страница была удалена.</p>
      <Link to="/"><Button size="lg">На главную</Button></Link>
    </div>
  );
}
