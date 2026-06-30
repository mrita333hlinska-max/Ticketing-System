import { useState } from 'react';
import type { Team } from '@/entities/team';
import { TeamFormPanel, TeamsTable, useTeams } from '@/features/manage-teams';
import { Button, Spinner } from '@/shared/ui';
import styles from './TeamsPage.module.css';

type FormState = { mode: 'create' } | { mode: 'edit'; team: Team } | null;

export function TeamsPage() {
  const teams = useTeams();
  const [form, setForm] = useState<FormState>(null);

  if (teams.status === 'loading')
    return <Spinner fullPage label="Loading teams…" />;
  if (teams.status === 'error') {
    return <p role="alert">Could not load teams. {teams.loadError}</p>;
  }

  function openCreate() {
    teams.clearActionError();
    setForm({ mode: 'create' });
  }

  function openEdit(team: Team) {
    teams.clearActionError();
    setForm({ mode: 'edit', team });
  }

  async function handleSubmit(name: string): Promise<boolean> {
    const succeeded =
      form?.mode === 'edit'
        ? await teams.renameTeam(form.team.id, name)
        : await teams.createTeam(name);
    if (succeeded) setForm(null);
    return succeeded;
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Teams</h1>
          <p className={styles.caption}>
            All verified users can view and manage all teams.
          </p>
        </div>
        <Button onClick={openCreate}>+ Create team</Button>
      </header>

      <TeamsTable
        teams={teams.teams}
        countsFor={teams.countsFor}
        onEdit={openEdit}
        onDelete={(team) => teams.deleteTeam(team.id)}
      />

      {/* Delete errors (no form open) surface here; form errors show in-panel. */}
      {!form && teams.actionError && (
        <p className={styles.error} role="alert">
          {teams.actionError}
        </p>
      )}

      {form && (
        <TeamFormPanel
          key={form.mode === 'edit' ? form.team.id : 'create'}
          mode={form.mode}
          initialName={form.mode === 'edit' ? form.team.name : ''}
          error={teams.actionError}
          onSubmit={handleSubmit}
          onCancel={() => {
            teams.clearActionError();
            setForm(null);
          }}
        />
      )}
    </section>
  );
}
