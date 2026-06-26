import api from './api';

export interface HelpSettings {
  address: string | null;
  mobile: string | null;
  email: string | null;
  whatsappNumber: string | null;
}

export interface SupportTicketPayload {
  name: string;
  mobile: string;
  email?: string;
  message: string;
}

const helpService = {
  getSettings: () =>
    api.get<{success: boolean; data: HelpSettings}>('/help/public/settings'),

  submitTicket: (payload: SupportTicketPayload) =>
    api.post<{success: boolean; message: string; data: {ticketCode: string}}>(
      '/help/public/tickets',
      payload,
    ),
};

export default helpService;
