import { classNames } from '@/shared/lib';
import styles from './Spinner.module.css';

interface SpinnerProps {
  /** Accessible label announced to screen readers. */
  label?: string;
  /** Center within a full-height block (e.g. page-level loading). */
  fullPage?: boolean;
}

export function Spinner({
  label = 'Loading…',
  fullPage = false,
}: SpinnerProps) {
  return (
    <div
      className={classNames(styles.container, fullPage && styles.fullPage)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} aria-hidden="true" />
      {/* Text for screen readers; the visual spinner is aria-hidden. */}
      <span className={styles.visuallyHidden}>{label}</span>
    </div>
  );
}
