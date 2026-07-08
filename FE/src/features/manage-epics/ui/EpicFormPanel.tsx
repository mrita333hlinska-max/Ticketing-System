import { useState } from 'react';
import { Button, Modal, TextArea, TextInput } from '@/shared/ui';
import styles from './EpicFormPanel.module.css';

interface EpicFormPanelProps {
  mode: 'create' | 'edit';
  initialTitle?: string;
  initialDescription?: string;
  /** Server-side error (e.g. empty title) shown under the title field. */
  error?: string | null;
  /** Returns true on success (panel then closes via parent). */
  onSubmit: (title: string, description: string) => Promise<boolean>;
  onCancel: () => void;
}

export function EpicFormPanel({
  mode,
  initialTitle = '',
  initialDescription = '',
  error,
  onSubmit,
  onCancel,
}: EpicFormPanelProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const succeeded = await onSubmit(title, description);
    if (!succeeded) setSubmitting(false); // on success the parent unmounts us
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Edit epic' : 'Create epic'}
      onClose={onCancel}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextInput
          label="Title"
          placeholder="e.g. Checkout reliability"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={error ?? undefined}
          autoFocus
        />
        <TextArea
          label="Description (optional)"
          rows={3}
          placeholder="Short optional description…"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !title.trim()}>
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
