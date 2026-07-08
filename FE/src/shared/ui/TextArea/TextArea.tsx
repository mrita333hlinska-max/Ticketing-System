import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { classNames } from '@/shared/lib';
import styles from './TextArea.module.css';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Mark the field invalid (red border) without rendering a message. */
  invalid?: boolean;
}

export function TextArea({
  label,
  error,
  invalid,
  id,
  className,
  rows = 5,
  ...rest
}: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const isInvalid = Boolean(error) || Boolean(invalid);
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
        className={classNames(styles.input, isInvalid && styles.invalid, className)}
        aria-invalid={isInvalid ? true : undefined}
        {...rest}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
