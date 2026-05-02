import { apiFetch } from "./client";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { ApiRequestError } from "./client";

interface Ticket {
  ticket_id: string;
  subject: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface TicketFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export const ticketsApi = {
  getMyTickets: () => apiFetch<Ticket[]>("/members/me/tickets"),

  getAllTickets: (filters: TicketFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    return apiFetch<{ tickets: Ticket[]; total: number }>(
      `/staff/tickets?${params.toString()}`,
    );
  },

  getMyTranscript: async (ticketId: string): Promise<Blob> => {
    const res = await fetch(
      `${API_URL}/members/me/tickets/${ticketId}/transcript`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) throw new ApiRequestError(res.status, "UNKNOWN", res.statusText);
    return res.blob();
  },

  getStaffTranscript: async (ticketId: string): Promise<Blob> => {
    const res = await fetch(
      `${API_URL}/staff/tickets/${ticketId}/transcript`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) throw new ApiRequestError(res.status, "UNKNOWN", res.statusText);
    return res.blob();
  },
};
