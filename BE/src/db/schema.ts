/**
 * Database schema (Drizzle / PostgreSQL) — REQUIREMENTS §3–§9.
 *
 * Design notes:
 * - All primary keys are UUIDs (`gen_random_uuid()`, built into Postgres ≥13).
 * - All timestamps are `timestamptz`; the API serializes them as ISO-8601 UTC.
 * - Case-insensitive uniqueness (email, team name) is a unique index over
 *   `lower(column)`.
 * - `updated_at` is set by the service layer (only on a real change), NOT by a
 *   DB trigger — so an unchanged save and adding a comment never advance it
 *   (§6, §7).
 * - A ticket's optional epic must belong to the ticket's own team (§5, §6). This
 *   is enforced at the database level by a COMPOSITE foreign key
 *   `(epic_id, team_id) → epics(id, team_id)`: when `epic_id` is null the FK is
 *   not checked (epic is optional); when set, both columns must match a single
 *   epic row, which pins it to the same team. The service layer enforces the
 *   same rule for friendly error messages.
 * - Deletion rules: team delete is RESTRICTed while epics/tickets reference it,
 *   epic delete is RESTRICTed while tickets reference it (both surface as 409),
 *   and deleting a ticket CASCADEs its comments (§6, §9).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// --- Enums (canonical API values, §6) ---

export const ticketTypeEnum = pgEnum('ticket_type', [
  'bug',
  'feature',
  'fix',
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'new',
  'ready_for_implementation',
  'in_progress',
  'ready_for_acceptance',
  'done',
]);

// --- Users (§3) ---

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Emails are unique and compared case-insensitively (§3).
    uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`),
  ],
);

// --- Email verification tokens (§3) ---

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    // Single-use (§3): stamped when consumed.
    usedAt: timestamp('used_at', { withTimezone: true }),
    // Expires 24h after issue (§3).
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('verification_tokens_user_idx').on(table.userId)],
);

// --- Teams (§4) ---

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Team names are non-empty (service-enforced) and unique case-insensitively.
    uniqueIndex('teams_name_lower_unique').on(sql`lower(${table.name})`),
  ],
);

// --- Epics (§5) ---

export const epics = pgTable(
  'epics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Chosen at creation, immutable thereafter; blocks team delete (RESTRICT).
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('epics_team_idx').on(table.teamId),
    // Referenced by the tickets composite FK below (same-team enforcement).
    unique('epics_id_team_unique').on(table.id, table.teamId),
  ],
);

// --- Tickets (§6) ---

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    type: ticketTypeEnum('type').notNull(),
    status: ticketStatusEnum('status').notNull().default('new'),
    // Nullable; same-team integrity enforced by the composite FK below.
    epicId: uuid('epic_id'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('tickets_team_idx').on(table.teamId),
    // Board query is per-team, ordered/filtered by status — keep it fast at 100+.
    index('tickets_team_status_idx').on(table.teamId, table.status),
    index('tickets_epic_idx').on(table.epicId),
    // Composite FK: an epic reference must match an epic of the SAME team (§5, §6).
    // RESTRICT blocks deleting an epic still referenced by a ticket (→ 409).
    foreignKey({
      name: 'tickets_epic_team_fk',
      columns: [table.epicId, table.teamId],
      foreignColumns: [epics.id, epics.teamId],
    }).onDelete('restrict'),
  ],
);

// --- Comments (§7) ---

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Deleting a ticket deletes its comments (§6).
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('comments_ticket_idx').on(table.ticketId)],
);
