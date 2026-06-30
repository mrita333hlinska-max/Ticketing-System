import { describe, expect, it } from 'vitest';
import { classNames } from '@/shared/lib';

describe('classNames', () => {
  it('joins truthy class names with a space', () => {
    expect(classNames('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values (conditional classes)', () => {
    const active = false;
    const disabled = true;
    expect(classNames('base', active && 'active', disabled && 'disabled')).toBe(
      'base disabled',
    );
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(classNames(false, null, undefined)).toBe('');
  });
});
