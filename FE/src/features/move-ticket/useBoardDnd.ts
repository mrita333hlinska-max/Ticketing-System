import { useState } from 'react';
import type { DragEvent } from 'react';
import type { TicketStatus } from '@/entities/ticket';

/** Custom MIME type so we only react to our own card drags. */
const DRAG_FORMAT = 'application/x-ticket-id';

/**
 * Native HTML5 drag-and-drop wiring for the board (no DnD library — KISS).
 * Cards are draggable; columns are drop targets. On drop, `onMove` is invoked
 * with the dragged ticket and the destination status; the board owns the
 * optimistic update + revert (REQUIREMENTS §8).
 */
export function useBoardDnd(
  onMove: (ticketId: string, to: TicketStatus) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TicketStatus | null>(null);

  function cardHandlers(ticketId: string) {
    return {
      draggable: true,
      onDragStart: (event: DragEvent) => {
        event.dataTransfer.setData(DRAG_FORMAT, ticketId);
        event.dataTransfer.effectAllowed = 'move';
        setDraggingId(ticketId);
      },
      onDragEnd: () => {
        setDraggingId(null);
        setDropTarget(null);
      },
    };
  }

  function columnHandlers(status: TicketStatus) {
    return {
      onDragOver: (event: DragEvent) => {
        if (!event.dataTransfer.types.includes(DRAG_FORMAT)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget(status);
      },
      onDragLeave: () => {
        setDropTarget((current) => (current === status ? null : current));
      },
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        const ticketId = event.dataTransfer.getData(DRAG_FORMAT);
        setDropTarget(null);
        setDraggingId(null);
        if (ticketId) onMove(ticketId, status);
      },
    };
  }

  return { draggingId, dropTarget, cardHandlers, columnHandlers };
}
