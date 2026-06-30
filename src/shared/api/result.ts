/**
 * A request outcome that never throws — the building block of the service
 * layer (PROJECT_RULES §2). Services return `Result`; hooks branch on it to set
 * state, so they hold no `try/catch` around API calls.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Run an async API call, converting success/failure into a `Result`. */
export async function runRequest<T>(
  operation: () => Promise<T>,
): Promise<Result<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Something went wrong.',
    };
  }
}
