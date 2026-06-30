import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { classNames } from '@/shared/lib';
import styles from './TextArea.module.css';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  id,
  className,
  rows = 5,
  ...rest
}: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        className={classNames(styles.input, error && styles.invalid, className)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
