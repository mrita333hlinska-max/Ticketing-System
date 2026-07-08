import { useState } from 'react';
import type { Epic } from '@/entities/epic';
import {
  TICKET_TYPES,
  TYPE_LABELS,
  type CreateTicketInput,
  type TicketType,
} from '@/entities/ticket';
import {
  Button,
  Modal,
  Select,
  TextArea,
  TextInput,
  type SelectOption,
} from '@/shared/ui';
import styles from './CreateTicketDialog.module.css';

interface CreateTicketDialogProps {
  /** The team the new ticket belongs to (the board's selected team). */
  teamId: string;
  /** Epics of that team, offered in the optional epic picker. */
  epics: Epic[];
  onSubmit: (input: CreateTicketInput) => Promise<void>;
  onClose: () => void;
}

const NO_EPIC = 'none';

const TYPE_OPTIONS: SelectOption[] = TICKET_TYPES.map((type) => ({
  value: type,
  label: TYPE_LABELS[type],
}));

export function CreateTicketDialog({
  teamId,
  epics,
  onSubmit,
  onClose,
}: CreateTicketDialogProps) {
  const [type, setType] = useState<TicketType>('bug');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [epicId, setEpicId] = useState<string>(NO_EPIC);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);

  // After a failed submit, flag the empty required fields; the red clears
  // itself as soon as the field has content.
  const titleInvalid = triedSubmit && !title.trim();
  const bodyInvalid = triedSubmit && !body.trim();

  const epicOptions: SelectOption[] = [
    { value: NO_EPIC, label: 'No epic' },
    ...epics.map((epic) => ({ value: epic.id, label: epic.title })),
  ];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setTriedSubmit(true);
      setError(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        teamId,
        type,
        title: title.trim(),
        body: body.trim(),
        epicId: epicId === NO_EPIC ? null : epicId,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not create the ticket.',
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New ticket" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(event) => setType(event.target.value as TicketType)}
        />
        <TextInput
          label="Title"
          placeholder="Short summary of the issue"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          invalid={titleInvalid}
          autoFocus
        />
        <TextArea
          label="Body"
          placeholder="Describe the problem or request…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          invalid={bodyInvalid}
        />
        <Select
          label="Epic (optional)"
          options={epicOptions}
          value={epicId}
          onChange={(event) => setEpicId(event.target.value)}
        />

        {(titleInvalid || bodyInvalid) && (
          <p className={styles.error}>Title and body are required.</p>
        )}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
