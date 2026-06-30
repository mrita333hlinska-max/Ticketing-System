import { Link, useParams } from 'react-router-dom';

export function TicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  return (
    <section>
      <p>
        <Link to="/board">← Back to board</Link>
      </p>
      <h1>Ticket {ticketId}</h1>
      <p>The ticket detail / edit view is built in Phase 5.</p>
    </section>
  );
}
