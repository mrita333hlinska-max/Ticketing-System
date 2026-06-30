import { TYPE_LABELS, type Ticket } from '@/entities/ticket';
import { formatRelativeTime } from '@/shared/lib';
import { Badge } from '@/shared/ui';
import styles from './TicketCard.module.css';

interface TicketCardProps {
  ticket: Ticket;
  /** Resolved epic title for `ticket.epicId`, if any. */
  epicName?: string | null;
  onOpen?: (ticketId: string) => void;
}

/** Presentational ticket card for the board (REQUIREMENTS §8). */
export function TicketCard({ ticket, epicName, onOpen }: TicketCardProps) {
  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(ticket.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.(ticket.id);
        }
      }}
    >
      <Badge>{TYPE_LABELS[ticket.type]}</Badge>
      <h3 className={styles.title}>{ticket.title}</h3>
      {epicName && <p className={styles.epic}>Epic: {epicName}</p>}
      <time className={styles.time} dateTime={ticket.updatedAt}>
        {formatRelativeTime(ticket.updatedAt)}
      </time>
    </article>
  );
}
