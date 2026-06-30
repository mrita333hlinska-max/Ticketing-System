export type {
  Ticket,
  TicketType,
  TicketStatus,
  CreateTicketInput,
  UpdateTicketInput,
} from './types';
export {
  WORKFLOW_STATES,
  STATUS_LABELS,
  INITIAL_STATUS,
  TICKET_TYPES,
  TYPE_LABELS,
  isTicketStatus,
  isTicketType,
  getStatusOrder,
  canMove,
} from './workflow';
