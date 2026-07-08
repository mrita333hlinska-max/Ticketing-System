import type { DragEvent } from 'react';
import {
  STATUS_LABELS,
  TicketCard,
  type Ticket,
  type TicketStatus,
} from '@/entities/ticket';
import { classNames } from '@/shared/lib';
import styles from './BoardColumn.module.css';

interface DragHandlers {
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

interface CardHandlers {
  draggable: boolean;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: (event: DragEvent) => void;
}

interface BoardColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
  epicNameById: Map<string, string>;
  isDropTarget: boolean;
  columnHandlers: DragHandlers;
  cardHandlers: (ticketId: string) => CardHandlers;
  onOpenTicket: (ticketId: string) => void;
}

export function BoardColumn({
  status,
  tickets,
  epicNameById,
  isDropTarget,
  columnHandlers,
  cardHandlers,
  onOpenTicket,
}: BoardColumnProps) {
  return (
    <section
      className={styles.column}
      data-status={status}
      aria-label={STATUS_LABELS[status]}
    >
      <header className={styles.header}>
        <span className={styles.label}>{STATUS_LABELS[status]}</span>
        <span className={styles.count}>{tickets.length}</span>
      </header>

      <div
        className={classNames(styles.dropZone, isDropTarget && styles.dropOver)}
        {...columnHandlers}
      >
        {tickets.map((ticket) => (
          <div key={ticket.id} {...cardHandlers(ticket.id)}>
            <TicketCard
              ticket={ticket}
              epicName={ticket.epicId ? epicNameById.get(ticket.epicId) : null}
              onOpen={onOpenTicket}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
