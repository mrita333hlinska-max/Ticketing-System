import type { ReactNode } from 'react';
import styles from './AuthCard.module.css';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Centered card shell for the auth screens (no app chrome). */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className={styles.center}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
