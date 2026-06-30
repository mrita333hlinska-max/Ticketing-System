import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@/shared/ui';
import { useTicketDetail } from './model/useTicketDetail';
import { TicketDetail } from './ui/TicketDetail';

export function TicketPage() {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const detail = useTicketDetail(ticketId);

  if (detail.status === 'loading') {
    return <Spinner fullPage label="Loading ticket…" />;
  }
  if (detail.status === 'error' || !detail.data) {
    return <p role="alert">Could not load ticket. {detail.loadError}</p>;
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete this ticket and its comments? This cannot be undone.',
    );
    if (!confirmed) return;
    const succeeded = await detail.removeTicket();
    if (succeeded) navigate('/board');
  }

  return (
    <TicketDetail
      key={detail.data.ticket.id}
      ticket={detail.data.ticket}
      teams={detail.data.teams}
      epics={detail.data.epics}
      users={detail.data.users}
      comments={detail.data.comments}
      actionError={detail.actionError}
      onSave={detail.saveTicket}
      onDelete={handleDelete}
      onAddComment={detail.postComment}
    />
  );
}
