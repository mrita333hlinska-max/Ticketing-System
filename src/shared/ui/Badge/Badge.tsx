import type { ReactNode } from 'react';
import { classNames } from '@/shared/lib';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
  /** Visually de-emphasized variant (e.g. column counts). */
  muted?: boolean;
  className?: string;
}

export function Badge({ children, muted = false, className }: BadgeProps) {
  return (
    <span
      className={classNames(styles.badge, muted && styles.muted, className)}
    >
      {children}
    </span>
  );
}
