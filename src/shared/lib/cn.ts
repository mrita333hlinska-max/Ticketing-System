/**
 * Join truthy class names into a single string.
 * Keeps conditional styling readable: cn(styles.card, isActive && styles.active)
 */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}
