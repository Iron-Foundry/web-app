import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { TileRaceRoll } from "@/types/tilerace";

/**
 * Refetch the board whenever a roll lands that this browser did not make.
 *
 * Only the roll list is polled. The event itself - team positions and the fog
 * of war horizon, which is derived from the furthest team - is cached, so
 * without this every other viewer keeps the board they loaded with and the fog
 * never lifts. Invalidating the event does not change the roll list, so this
 * cannot feed itself.
 */
export function useBoardRedraw(
  eventId: string,
  rolls: TileRaceRoll[] | undefined,
): void {
  const qc = useQueryClient();
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!rolls || !eventId) return;
    if (!initialized.current) {
      for (const roll of rolls) seenIds.current.add(roll.id);
      initialized.current = true;
      return;
    }
    const fresh = rolls.filter((roll) => !seenIds.current.has(roll.id));
    if (fresh.length === 0) return;
    for (const roll of fresh) seenIds.current.add(roll.id);
    qc.invalidateQueries({ queryKey: queryKeys.tilerace.active() });
    qc.invalidateQueries({ queryKey: queryKeys.tilerace.event(eventId) });
  }, [rolls, eventId, qc]);
}
