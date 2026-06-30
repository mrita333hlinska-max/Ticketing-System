import type { Epic } from '@/entities/epic';
import { formatShortDate } from '@/shared/lib';
import { Button } from '@/shared/ui';
import styles from './EpicsTable.module.css';

interface EpicsTableProps {
  epics: Epic[];
  ticketCountFor: (epicId: string) => number;
  onEdit: (epic: Epic) => void;
  onDelete: (epic: Epic) => void;
}

export function EpicsTable({
  epics,
  ticketCountFor,
  onEdit,
  onDelete,
}: EpicsTableProps) {
  if (epics.length === 0) {
    return <p className={styles.empty}>No epics yet for this team.</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th className={styles.numeric}>Tickets</th>
            <th>Modified</th>
            <th className={styles.actionsHead}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {epics.map((epic) => {
            const ticketCount = ticketCountFor(epic.id);
            const deletable = ticketCount === 0;
            return (
              <tr key={epic.id}>
                <td>
                  <div className={styles.title}>{epic.title}</div>
                  <div className={styles.description}>
                    {epic.description ?? 'No description'}
                  </div>
                </td>
                <td className={styles.numeric}>{ticketCount}</td>
                <td>{formatShortDate(epic.updatedAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => onEdit(epic)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      aria-label={`Delete epic ${epic.title}`}
                      onClick={() => onDelete(epic)}
                      disabled={!deletable}
                      title={
                        deletable ? undefined : 'Reassign its tickets first.'
                      }
                    >
                      ✕
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.note}>
        Delete is disabled while tickets reference the epic.
      </p>
    </div>
  );
}
