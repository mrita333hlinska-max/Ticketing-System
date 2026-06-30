import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { classNames } from '@/shared/lib';
import styles from './TextInput.module.css';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Validation message shown below the field. */
  error?: string;
}

export function TextInput({
  label,
  error,
  id,
  className,
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={classNames(styles.input, error && styles.invalid, className)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
