import { apiFetch, ApiRequestError } from "@/api/client";
import type { DraftSetupBody, DraftView } from "@/types/frenzyDraft";

const draftPath = (eventId: number): string => `/frenzy/events/${eventId}/draft`;

const post = (path: string, body?: unknown): Promise<DraftView> =>
  apiFetch<DraftView>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

/** The frenzy captain draft: the public view, the picks, and the staff steps. */
export const frenzyDraftApi = {
  /** The event's draft, or null when the event has none. */
  get: async (eventId: number): Promise<DraftView | null> => {
    try {
      return await apiFetch<DraftView>(draftPath(eventId));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) return null;
      throw err;
    }
  },
  setUp: (eventId: number, body: DraftSetupBody) =>
    apiFetch<DraftView>(draftPath(eventId), { method: "PUT", body: JSON.stringify(body) }),
  draw: (eventId: number) => post(`${draftPath(eventId)}/draw`),
  start: (eventId: number) => post(`${draftPath(eventId)}/start`),
  pick: (eventId: number, signupId: number, pickNumber: number) =>
    post(`${draftPath(eventId)}/picks`, { signup_id: signupId, pick_number: pickNumber }),
  move: (eventId: number, signupId: number, teamId: number) =>
    post(`${draftPath(eventId)}/moves`, { signup_id: signupId, team_id: teamId }),
  reset: (eventId: number) => apiFetch<void>(draftPath(eventId), { method: "DELETE" }),
};

export function draftSocketUrl(apiUrl: string): string {
  return `${apiUrl.replace(/^http/, "ws")}/frenzy/draft/live`;
}
