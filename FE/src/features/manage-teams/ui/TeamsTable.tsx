import type { Team } from '@/entities/team';
import { formatShortDate } from '@/shared/lib';
import { Button } from '@/shared/ui';
import type { TeamCounts } from '../model/useTeams';
import styles from './TeamsTable.module.css';

interface TeamsTableProps {
  teams: Team[];
  countsFor: (teamId: string) => TeamCounts;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamsTable({
  teams,
  countsFor,
  onEdit,
  onDelete,
}: TeamsTableProps) {
  if (teams.length === 0) {
    return (
      <p className={styles.empty}>No teams yet. Create your first team.</p>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th className={styles.numeric}>Tickets</th>
            <th className={styles.numeric}>Epics</th>
            <th>Modified</th>
            <th className={styles.actionsHead}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const counts = countsFor(team.id);
            const deletable = counts.tickets === 0 && counts.epics === 0;
            return (
              <tr key={team.id}>
                <td className={styles.name}>{team.name}</td>
                <td className={styles.numeric}>{counts.tickets}</td>
                <td className={styles.numeric}>{counts.epics}</td>
                <td>{formatShortDate(team.updatedAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => onEdit(team)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onDelete(team)}
                      disabled={!deletable}
                      title={
                        deletable
                          ? undefined
                          : 'Remove its tickets and epics first.'
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.note}>
        Delete is disabled while a team contains tickets or epics.
      </p>
    </div>
  );
}
