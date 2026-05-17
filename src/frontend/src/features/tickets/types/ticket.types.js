/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'OPEN' | 'IN_PROGRESS' | 'CLOSED'} status
 */

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED'
};
