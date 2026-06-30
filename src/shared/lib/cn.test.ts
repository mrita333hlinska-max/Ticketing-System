import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/lib';

describe('cn', () => {
  it('joins truthy class names with a space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values (conditional classes)', () => {
    const active = false;
    const disabled = true;
    expect(cn('base', active && 'active', disabled && 'disabled')).toBe(
      'base disabled',
    );
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
