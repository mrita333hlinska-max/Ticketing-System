import type { ReactNode } from 'react';
import { classNames } from '@/shared/lib';
import styles from './Badge.module.css';

/** Colour tones for categorised badges (e.g. ticket type). */
export type BadgeTone = 'neutral' | 'green' | 'blue' | 'red';

interface BadgeProps {
  children: ReactNode;
  /** Colour tone; defaults to the neutral grey badge. */
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={classNames(
        styles.badge,
        tone !== 'neutral' && styles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
