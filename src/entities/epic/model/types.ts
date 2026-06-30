/**
 * Epic domain types — REQUIREMENTS §5.
 *
 * An epic belongs to exactly one team, chosen at creation and immutable after
 * (no team field in UpdateEpicInput). Titles are non-empty after trimming.
 */
export interface Epic {
  id: string;
  /** Owning team; immutable once created. */
  teamId: string;
  title: string;
  description: string | null;
  /** ISO-8601, UTC, server-set. */
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpicInput {
  teamId: string;
  title: string;
  description: string | null;
}

/** Team is intentionally absent — moving epics between teams is out of scope. */
export type UpdateEpicInput = Partial<{
  title: string;
  description: string | null;
}>;
