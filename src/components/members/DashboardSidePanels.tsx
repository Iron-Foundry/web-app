import { ArrowRight } from "lucide-react";
import { BadgeHoverCard } from "@/components/badges/badgeHoverCard";
import type { AccountRanking, NameChange, PlayerBadge } from "@/types/members";
import { cn } from "@/lib/utils";
import { timeAgo } from "./feedHelpers";
import { Panel } from "./Panel";

const NAME_CHANGE_LIMIT = 5;
const ROW = "flex items-center gap-2 py-2 text-sm min-w-0";

export function AccountRanksPanel({ rankings }: { rankings: AccountRanking[] }): React.ReactElement {
  return (
    <Panel title="Account Ranks">
      {rankings.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No accounts linked.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rankings.map((a) => (
            <li key={a.rsn} className={ROW}>
              <span className={cn("min-w-0 flex-1 truncate", !a.is_primary && "text-muted-foreground")}>{a.rsn}</span>
              <span className="text-xs text-muted-foreground">{a.rank ?? "No Rank"}</span>
              {a.points != null && <span className="font-rs-bold">{a.points.toLocaleString()}</span>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function BadgesPanel({ badges }: { badges: PlayerBadge[] }): React.ReactElement {
  return (
    <Panel title="Badges">
      {badges.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No badges earned yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <BadgeHoverCard key={b.id} badge={b} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium cursor-default" />
          ))}
        </div>
      )}
    </Panel>
  );
}

interface NameChangesProps {
  nameChanges: NameChange[];
  loading: boolean;
  onShowAll: () => void;
}

export function NameChangesPanel({ nameChanges, loading, onShowAll }: NameChangesProps): React.ReactElement {
  const hidden = nameChanges.length - NAME_CHANGE_LIMIT;
  return (
    <Panel title="Name Changes" more={hidden > 0 ? { label: `Show ${hidden} more…`, onClick: onShowAll } : null}>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && nameChanges.length === 0 && <p className="text-sm italic text-muted-foreground">No recent name changes.</p>}
      <ul className="divide-y divide-border">
        {nameChanges.slice(0, NAME_CHANGE_LIMIT).map((nc) => (
          <li key={`${nc.old_name}-${nc.new_name}-${nc.resolved_at ?? ""}`} className={ROW}>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{nc.old_name}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span className="min-w-0 flex-1 truncate font-medium">{nc.new_name}</span>
            {nc.resolved_at && <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(nc.resolved_at)}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
