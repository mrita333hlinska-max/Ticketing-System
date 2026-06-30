/**
 * Generate a unique id, preferring the platform crypto API.
 *
 * Note: real entity ids come from the backend (REQUIREMENTS §9). This is for
 * client-side keys and the temporary dev stub adapter only.
 */
export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes / non-secure contexts.
  return `id-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
