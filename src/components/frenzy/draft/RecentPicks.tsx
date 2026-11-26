import { Panel } from "@/components/members/Panel";
import type { RecentPick } from "@/lib/frenzyDraft";

/** The newest picks first, each with the captain who made it. */
export function RecentPicks({ picks }: { picks: RecentPick[] }): React.ReactElement {
  return (
    <Panel title="Recent picks">
      {picks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No picks yet.</p>
      ) : (
        <ol className="divide-y divide-border text-sm">
          {picks.map((p) => (
            <li key={p.pick} className="grid grid-cols-avatar-row gap-2 py-1.5">
              <span className="text-xs tabular-nums text-muted-foreground">{p.pick}</span>
              <p className="min-w-0 truncate">
                {p.captain} took <b className="text-foreground">{p.rsn}</b>
                <span className="block text-xs text-muted-foreground">Round {p.round}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
