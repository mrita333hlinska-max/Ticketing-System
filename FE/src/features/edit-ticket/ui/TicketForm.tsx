import type { Epic } from '@/entities/epic';
import type { Team } from '@/entities/team';
import {
  STATUS_LABELS,
  TICKET_TYPES,
  TYPE_LABELS,
  WORKFLOW_STATES,
  type TicketStatus,
  type TicketType,
} from '@/entities/ticket';
import { Select, TextArea, TextInput, type SelectOption } from '@/shared/ui';
import type { TicketFormState } from '../model/useTicketForm';
import styles from './TicketForm.module.css';

interface TicketFormProps {
  form: TicketFormState;
  teams: Team[];
  /** All epics; filtered to the form's current team for the picker. */
  epics: Epic[];
}

const NO_EPIC = 'none';

const TYPE_OPTIONS: SelectOption[] = TICKET_TYPES.map((type) => ({
  value: type,
  label: TYPE_LABELS[type],
}));

const STATE_OPTIONS: SelectOption[] = WORKFLOW_STATES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

export function TicketForm({ form, teams, epics }: TicketFormProps) {
  const teamOptions: SelectOption[] = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  const epicOptions: SelectOption[] = [
    { value: NO_EPIC, label: 'No epic' },
    ...epics
      .filter((epic) => epic.teamId === form.teamId)
      .map((epic) => ({ value: epic.id, label: epic.title })),
  ];

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <Select
          label="Team"
          options={teamOptions}
          value={form.teamId}
          onChange={(event) => form.changeTeam(event.target.value)}
        />
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={form.type}
          onChange={(event) => form.setType(event.target.value as TicketType)}
        />
        <Select
          label="State"
          options={STATE_OPTIONS}
          value={form.status}
          onChange={(event) =>
            form.setStatus(event.target.value as TicketStatus)
          }
        />
      </div>

      <Select
        label="Epic"
        options={epicOptions}
        value={form.epicId ?? NO_EPIC}
        onChange={(event) =>
          form.setEpicId(
            event.target.value === NO_EPIC ? null : event.target.value,
          )
        }
      />

      <TextInput
        label="Title"
        placeholder="Short summary of the issue"
        value={form.title}
        onChange={(event) => form.setTitle(event.target.value)}
      />

      <TextArea
        label="Body"
        rows={8}
        placeholder="Describe the problem or request…"
        value={form.body}
        onChange={(event) => form.setBody(event.target.value)}
      />
    </div>
  );
}
