import { apiFetch } from "@/api/client";
import { browserTimeZone } from "@/lib/timeZones";
import type { FrenzySignupList, MyFrenzySignup } from "@/types/frenzy";

const signupPath = (eventId: number): string => `/frenzy/events/${eventId}/signup`;

export interface FrenzySignupChoice {
  accountId: number | null;
  wantsCaptain: boolean;
}

/** The signup body; every signup and change carries the browser's time zone. */
function signupBody({ accountId, wantsCaptain }: FrenzySignupChoice): string {
  const base = { wants_captain: wantsCaptain, timezone: browserTimeZone() };
  return JSON.stringify(accountId === null ? base : { ...base, account_id: accountId });
}

/** A member's own frenzy signup, and the staff switch that opens and closes signups. */
export const frenzySignupsApi = {
  signUp: (eventId: number, choice: FrenzySignupChoice) =>
    apiFetch<MyFrenzySignup>(signupPath(eventId), { method: "POST", body: signupBody(choice) }),
  changeSignup: (eventId: number, choice: FrenzySignupChoice) =>
    apiFetch<void>(signupPath(eventId), { method: "PATCH", body: signupBody(choice) }),
  withdraw: (eventId: number) => apiFetch<void>(signupPath(eventId), { method: "DELETE" }),
  listSignups: (eventId: number) => apiFetch<FrenzySignupList>(`/frenzy/events/${eventId}/signups`),
  setSignupsOpen: (eventId: number, open: boolean) =>
    apiFetch<{ ok: boolean }>(`/frenzy/events/${eventId}`, { method: "PATCH", body: JSON.stringify({ signups_open: open }) }),
};
