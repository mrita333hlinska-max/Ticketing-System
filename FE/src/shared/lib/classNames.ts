/**
 * Join truthy class names into a single string.
 * Keeps conditional styling readable:
 *   classNames(styles.card, isActive && styles.active)
 */
export function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}
