import { apiFetch } from "./client";
import type { PlayerBadge } from "@/types/members";

interface StaffOverview {
  total_members: number;
  open_tickets: number;
  total_tickets: number;
}

interface StaffMember {
  discord_user_id: string;
  username: string;
  rsn: string | null;
  clan_rank: string | null;
  discord_roles: string[];
}

export const staffApi = {
  getOverview: () => apiFetch<StaffOverview>("/staff/overview"),

  getMembers: (search?: string) => {
    const url = search
      ? `/staff/members?search=${encodeURIComponent(search)}`
      : "/staff/members";
    return apiFetch<StaffMember[]>(url);
  },

  updateMemberRsn: (memberId: string, rsn: string) =>
    apiFetch<void>(`/staff/members/${memberId}/rsn`, {
      method: "PUT",
      body: JSON.stringify({ rsn }),
    }),

  getBadges: () => apiFetch<PlayerBadge[]>("/badges"),

  getBadgeMembers: (badgeId: string) =>
    apiFetch<StaffMember[]>(`/badges/${badgeId}/members`),

  assignBadge: (badgeId: string, userId: string) =>
    apiFetch<void>(`/badges/${badgeId}/assign`, {
      method: "POST",
      body: JSON.stringify({ discord_user_id: userId }),
    }),

  removeBadge: (badgeId: string, userId: string) =>
    apiFetch<void>(`/badges/${badgeId}/assign/${userId}`, { method: "DELETE" }),

  createBadge: (data: Omit<PlayerBadge, "id">) =>
    apiFetch<PlayerBadge>("/badges", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBadge: (id: string, data: Partial<Omit<PlayerBadge, "id">>) =>
    apiFetch<PlayerBadge>(`/badges/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteBadge: (id: string) => apiFetch<void>(`/badges/${id}`, { method: "DELETE" }),
};
