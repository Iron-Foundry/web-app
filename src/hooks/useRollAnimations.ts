import { useEffect, useRef, useState } from "react";
import type { TileRaceRoll } from "@/types/tilerace";

const ANIMATION_MS = 10000;

export function useRollAnimations(
  rolls: TileRaceRoll[] | undefined,
): Set<string> {
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const [rollingTeamIds, setRollingTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!rolls) return;
    if (!initialized.current) {
      for (const r of rolls) seenIds.current.add(r.id);
      initialized.current = true;
      return;
    }
    const freshRolls = rolls.filter((r) => !seenIds.current.has(r.id));
    if (freshRolls.length === 0) return;
    for (const r of freshRolls) seenIds.current.add(r.id);

    setRollingTeamIds((prev) => {
      const next = new Set(prev);
      for (const r of freshRolls) next.add(r.team_id);
      return next;
    });

    for (const r of freshRolls) {
      setTimeout(() => {
        setRollingTeamIds((prev) => {
          const next = new Set(prev);
          next.delete(r.team_id);
          return next;
        });
      }, ANIMATION_MS);
    }
  }, [rolls]);

  return rollingTeamIds;
}
