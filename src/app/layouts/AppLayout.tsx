import { Outlet } from 'react-router-dom';
import { TopNav } from '@/widgets/top-nav';
import styles from './AppLayout.module.css';

/** Chrome shared by all authenticated screens: top nav + routed content. */
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <TopNav />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
