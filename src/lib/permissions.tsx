import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

const RANK_ORDER = [
  "Guest",
  "Member",
  "Sergeant",
  "Lieutenant",
  "Captain",
  "General",
  "Mentor",
  "Moderator",
  "Senior Moderator",
  "Deputy Owner",
  "Owner",
] as const;

export function hasMinRank(userRank: string | null, minRank: string): boolean {
  if (!userRank) return false;
  const userIdx = RANK_ORDER.indexOf(userRank as (typeof RANK_ORDER)[number]);
  const minIdx = RANK_ORDER.indexOf(minRank as (typeof RANK_ORDER)[number]);
  if (userIdx === -1 || minIdx === -1) return false;
  return userIdx >= minIdx;
}

export function RequireRank({
  rank,
  children,
}: {
  rank: string;
  children: ReactNode;
}): JSX.Element {
  const { user } = useAuth();

  if (!hasMinRank(user?.clan_rank ?? null, rank)) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Access denied — requires rank <strong>{rank}</strong> or higher.
      </div>
    ) as JSX.Element;
  }

  return children as JSX.Element;
}
