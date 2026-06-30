import { useState } from 'react';
import type { TicketComment } from '@/entities/comment';
import { formatDateTimeUtc } from '@/shared/lib';
import { Button, TextArea } from '@/shared/ui';
import styles from './CommentsPanel.module.css';

interface CommentsPanelProps {
  comments: TicketComment[];
  /** Resolves an author id to a display name. */
  authorName: (authorId: string) => string;
  /** Returns true on success (clears the input). */
  onAdd: (body: string) => Promise<boolean>;
}

export function CommentsPanel({
  comments,
  authorName,
  onAdd,
}: CommentsPanelProps) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    const succeeded = await onAdd(body.trim());
    setSubmitting(false);
    if (succeeded) {
      setBody('');
      setError(null);
    } else {
      setError('Could not post your comment. Please try again.');
    }
  }

  return (
    <section className={styles.panel} aria-label="Comments">
      <header className={styles.header}>
        <h2 className={styles.title}>Comments</h2>
        <span className={styles.count}>{comments.length}</span>
      </header>

      {comments.length === 0 ? (
        <p className={styles.empty}>No comments yet.</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              <div className={styles.commentHead}>
                <span className={styles.author}>
                  {authorName(comment.authorId)}
                </span>
                <time dateTime={comment.createdAt} className={styles.time}>
                  {formatDateTimeUtc(comment.createdAt)}
                </time>
              </div>
              <p className={styles.body}>{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.addForm} onSubmit={handleSubmit}>
        <TextArea
          label="Add comment"
          rows={3}
          placeholder="Write a comment…"
          value={body}
          error={error ?? undefined}
          onChange={(event) => {
            setBody(event.target.value);
            if (error) setError(null);
          }}
        />
        <div className={styles.addActions}>
          <Button type="submit" disabled={submitting || !body.trim()}>
            {submitting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      </form>
    </section>
  );
}
