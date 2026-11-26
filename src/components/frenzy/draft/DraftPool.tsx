import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterPool, poolRanks } from "@/lib/frenzyDraft";
import type { DraftMember } from "@/types/frenzyDraft";
import { RankText } from "./RankText";
import { ZoneOffset, type ViewerZone } from "./ZoneOffset";

const ALL_RANKS = "all";
const ROW = "grid grid-cols-draft-row items-center gap-3";

interface Props {
  pool: DraftMember[];
  signupCount: number;
  pickLabel: string | null;
  busy: boolean;
  viewer: ViewerZone;
  onPick: (member: DraftMember) => void;
}

/** The signups left to pick, strongest first, in a virtual list with search and a rank filter. */
export function DraftPool({ pool, signupCount, pickLabel, busy, viewer, onPick }: Props): React.ReactElement {
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState(ALL_RANKS);
  const ranks = useMemo(() => poolRanks(pool), [pool]);
  const shown = useMemo(() => filterPool(pool, search, rank === ALL_RANKS ? null : rank), [pool, search, rank]);
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: shown.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 41,
    overscan: 12,
  });

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-rs-bold text-xl text-foreground">
          Available <span className="text-sm text-muted-foreground">{pool.length} of {signupCount} signups</span>
        </h2>
        <label className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search RSN..." aria-label="Search RSN" className="pl-8" />
        </label>
        <Select value={rank} onValueChange={setRank}>
          <SelectTrigger className="w-40" aria-label="Rank">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RANKS}>All ranks</SelectItem>
            {ranks.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className={`${ROW} border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground`}>
          <span>RSN</span><span>CC Rank</span><span className="text-right">Points</span><span />
        </div>
        <div ref={parentRef} className="max-h-104 overflow-y-auto">
          {shown.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">No signups match.</p>}
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((item) => {
              const m = shown[item.index]!;
              return (
                <div
                  key={m.signup_id}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className={`${ROW} border-b border-border px-4 py-1.5 text-sm`}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${item.start}px)` }}
                >
                  <span className="truncate font-medium">
                    {m.rsn}
                    <ZoneOffset zone={m.timezone} viewer={viewer} />
                  </span>
                  <RankText rank={m.rank} />
                  <span className="text-right tabular-nums">{m.points === null ? "-" : m.points.toLocaleString()}</span>
                  {pickLabel ? (
                    <Button size="sm" disabled={busy} onClick={() => onPick(m)}>{pickLabel}</Button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
