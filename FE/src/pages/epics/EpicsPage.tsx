import { useState } from 'react';
import type { Epic } from '@/entities/epic';
import { EpicFormPanel, EpicsTable, useEpics } from '@/features/manage-epics';
import { Button, Select, Spinner, type SelectOption } from '@/shared/ui';
import styles from './EpicsPage.module.css';

type FormState = { mode: 'create' } | { mode: 'edit'; epic: Epic } | null;

export function EpicsPage() {
  const epics = useEpics();
  const [form, setForm] = useState<FormState>(null);

  if (epics.status === 'loading') {
    return <Spinner fullPage label="Loading epics…" />;
  }
  if (epics.status === 'error') {
    return <p role="alert">Could not load epics. {epics.loadError}</p>;
  }

  if (epics.teams.length === 0) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Epics</h1>
        <p>Create a team first on the Teams page — epics belong to a team.</p>
      </section>
    );
  }

  const teamOptions: SelectOption[] = epics.teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  function openCreate() {
    epics.clearActionError();
    setForm({ mode: 'create' });
  }

  function openEdit(epic: Epic) {
    epics.clearActionError();
    setForm({ mode: 'edit', epic });
  }

  async function handleSubmit(
    title: string,
    description: string,
  ): Promise<boolean> {
    const succeeded =
      form?.mode === 'edit'
        ? await epics.updateEpic(form.epic.id, title, description)
        : await epics.createEpic(title, description);
    if (succeeded) setForm(null);
    return succeeded;
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Epics</h1>
        <Button onClick={openCreate}>+ Create epic</Button>
      </header>

      <Select
        label="Team"
        className={styles.teamSelect}
        options={teamOptions}
        value={epics.selectedTeamId ?? ''}
        onChange={(event) => {
          setForm(null);
          epics.selectTeam(event.target.value);
        }}
      />

      <EpicsTable
        epics={epics.visibleEpics}
        ticketCountFor={epics.ticketCountFor}
        onEdit={openEdit}
        onDelete={(epic) => epics.deleteEpic(epic.id)}
      />

      {/* Delete errors (no form open) surface here; form errors show in-panel. */}
      {!form && epics.actionError && (
        <p className={styles.error} role="alert">
          {epics.actionError}
        </p>
      )}

      {form && (
        <EpicFormPanel
          key={form.mode === 'edit' ? form.epic.id : 'create'}
          mode={form.mode}
          initialTitle={form.mode === 'edit' ? form.epic.title : ''}
          initialDescription={
            form.mode === 'edit' ? (form.epic.description ?? '') : ''
          }
          error={epics.actionError}
          onSubmit={handleSubmit}
          onCancel={() => {
            epics.clearActionError();
            setForm(null);
          }}
        />
      )}
    </section>
  );
}
