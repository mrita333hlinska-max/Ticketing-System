import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TicketComment } from '@/entities/comment';
import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import type { Ticket, UpdateTicketInput } from '@/entities/ticket';
import type { User } from '@/entities/user';
import { TicketForm, useTicketForm } from '@/features/edit-ticket';
import { CommentsPanel } from '@/features/manage-comments';
import { formatDateTimeUtc } from '@/shared/lib';
import { Button } from '@/shared/ui';
import styles from './TicketDetail.module.css';

interface TicketDetailProps {
  ticket: Ticket;
  teams: Team[];
  epics: Epic[];
  users: User[];
  comments: TicketComment[];
  actionError: string | null;
  onSave: (patch: UpdateTicketInput) => Promise<boolean>;
  onDelete: () => void;
  onAddComment: (body: string) => Promise<boolean>;
}

export function TicketDetail({
  ticket,
  teams,
  epics,
  users,
  comments,
  actionError,
  onSave,
  onDelete,
  onAddComment,
}: TicketDetailProps) {
  const form = useTicketForm(ticket);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const teamNameById = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );
  const userNameById = useMemo(
    () => new Map(users.map((user) => [user.id, user.displayName])),
    [users],
  );

  async function handleSave() {
    setSaving(true);
    setJustSaved(false);
    const succeeded = await onSave(form.buildPatch());
    setSaving(false);
    if (succeeded) {
      setJustSaved(true);
      // React 18 no-ops state updates after unmount, so no cleanup needed.
      window.setTimeout(() => setJustSaved(false), 2500);
    }
  }

  return (
    <article className={styles.page}>
      <Link to="/board" className={styles.back}>
        ← Back to {teamNameById.get(ticket.teamId) ?? 'board'}
      </Link>

      <div className={styles.headRow}>
        <div>
          <p className={styles.meta}>
            #{ticket.id.slice(0, 8)} • Created by{' '}
            {userNameById.get(ticket.createdBy) ?? 'Unknown'} • Created{' '}
            {formatDateTimeUtc(ticket.createdAt)} • Modified{' '}
            {formatDateTimeUtc(ticket.updatedAt)}
          </p>
          <h1 className={styles.title}>{ticket.title}</h1>
        </div>
        <div className={styles.actions}>
          {justSaved && (
            <span className={styles.saved} role="status">
              Saved ✓
            </span>
          )}
          <Button variant="secondary" onClick={onDelete}>
            Delete
          </Button>
          <Button onClick={handleSave} disabled={!form.isValid || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}

      <div className={styles.columns}>
        <TicketForm form={form} teams={teams} epics={epics} />
        <CommentsPanel
          comments={comments}
          authorName={(authorId) => userNameById.get(authorId) ?? 'Unknown'}
          onAdd={onAddComment}
        />
      </div>
    </article>
  );
}
