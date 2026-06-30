import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '@/shared/lib';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(styles.button, styles[variant], className)}
      {...rest}
    />
  );
}
