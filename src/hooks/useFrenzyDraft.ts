import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { draftSocketUrl, frenzyDraftApi } from "@/api/frenzyDraft";
import { frenzySignupsApi } from "@/api/frenzySignups";
import { API_URL } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import type { DraftSetupBody, DraftView } from "@/types/frenzyDraft";

const FIRST_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

export function useFrenzyDraft(eventId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.frenzy.draft(eventId ?? 0),
    queryFn: () => frenzyDraftApi.get(eventId as number),
    enabled: eventId !== undefined,
  });
}

/** Refetch the draft whenever the API says it changed; reconnects with a growing delay. */
export function useFrenzyDraftSocket(eventId: number | undefined): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (eventId === undefined) return;
    let closed = false;
    let backoff = FIRST_RETRY_MS;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = (): void => {
      if (closed) return;
      socket = new WebSocket(draftSocketUrl(API_URL));
      socket.onopen = () => {
        backoff = FIRST_RETRY_MS;
        qc.invalidateQueries({ queryKey: queryKeys.frenzy.draft(eventId) });
      };
      socket.onmessage = (event) => {
        const frame = JSON.parse(event.data as string) as { event_id?: number };
        if (frame.event_id === eventId) qc.invalidateQueries({ queryKey: queryKeys.frenzy.draft(eventId) });
      };
      socket.onclose = () => {
        if (closed) return;
        retry = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, MAX_RETRY_MS);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [eventId, qc]);
}

/** A draft mutation that writes the returned view straight into the cache. */
function useDraftMutation<A>(eventId: number, run: (args: A) => Promise<DraftView>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (view) => qc.setQueryData(queryKeys.frenzy.draft(eventId), view),
  });
}

export const usePickMember = (eventId: number) =>
  useDraftMutation(eventId, ({ signupId, pick }: { signupId: number; pick: number }) =>
    frenzyDraftApi.pick(eventId, signupId, pick),
  );

export const useMoveMember = (eventId: number) =>
  useDraftMutation(eventId, ({ signupId, teamId }: { signupId: number; teamId: number }) =>
    frenzyDraftApi.move(eventId, signupId, teamId),
  );

export const useSetUpDraft = (eventId: number) =>
  useDraftMutation(eventId, (body: DraftSetupBody) => frenzyDraftApi.setUp(eventId, body));

export const useDrawOrder = (eventId: number) => useDraftMutation(eventId, () => frenzyDraftApi.draw(eventId));

export const useStartDraft = (eventId: number) => useDraftMutation(eventId, () => frenzyDraftApi.start(eventId));

export function useResetDraft(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => frenzyDraftApi.reset(eventId),
    onSuccess: () => {
      qc.setQueryData(queryKeys.frenzy.draft(eventId), null);
      qc.invalidateQueries({ queryKey: queryKeys.frenzy.event(eventId) });
    },
  });
}

export function useFrenzySignupList(eventId: number) {
  return useQuery({
    queryKey: queryKeys.frenzy.signups(eventId),
    queryFn: () => frenzySignupsApi.listSignups(eventId),
  });
}
