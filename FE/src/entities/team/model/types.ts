/**
 * Team domain types — REQUIREMENTS §4.
 *
 * Names are non-empty after trimming and unique case-insensitively; those rules
 * are enforced server-side (the dev stub stands in until then).
 */
export interface Team {
  id: string;
  name: string;
  /** ISO-8601, UTC, server-set. */
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamInput {
  name: string;
}

export interface UpdateTeamInput {
  name: string;
}
