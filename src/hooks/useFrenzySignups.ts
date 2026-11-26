import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { frenzySignupsApi, type FrenzySignupChoice } from "@/api/frenzySignups";
import { queryKeys } from "@/lib/queryKeys";

function refreshActive(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: queryKeys.frenzy.active() });
}

export function useFrenzySignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, choice }: { eventId: number; choice: FrenzySignupChoice }) =>
      frenzySignupsApi.signUp(eventId, choice),
    onSuccess: () => refreshActive(qc),
  });
}

export function useFrenzyChangeSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, choice }: { eventId: number; choice: FrenzySignupChoice }) =>
      frenzySignupsApi.changeSignup(eventId, choice),
    onSuccess: () => refreshActive(qc),
  });
}

export function useFrenzyWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => frenzySignupsApi.withdraw(eventId),
    onSuccess: () => refreshActive(qc),
  });
}

/** The staff switch that opens or closes signups, refreshing the event views it changes. */
export function useSetFrenzySignupsOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, open }: { eventId: number; open: boolean }) =>
      frenzySignupsApi.setSignupsOpen(eventId, open),
    onSuccess: (_result, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.events() });
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
      refreshActive(qc);
    },
  });
}
