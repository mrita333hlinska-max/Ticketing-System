import { useState } from 'react';
import { Button, Modal, TextInput } from '@/shared/ui';
import styles from './TeamFormPanel.module.css';

interface TeamFormPanelProps {
  mode: 'create' | 'edit';
  initialName?: string;
  /** Server-side error (e.g. duplicate name) shown under the field. */
  error?: string | null;
  /** Returns true on success (panel then closes via parent). */
  onSubmit: (name: string) => Promise<boolean>;
  onCancel: () => void;
}

export function TeamFormPanel({
  mode,
  initialName = '',
  error,
  onSubmit,
  onCancel,
}: TeamFormPanelProps) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const succeeded = await onSubmit(name);
    if (!succeeded) setSubmitting(false); // on success the parent unmounts us
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Edit team' : 'Create team'}
      onClose={onCancel}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextInput
          label="Team name"
          placeholder="e.g. Platform Engineering"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error ?? undefined}
          autoFocus
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
