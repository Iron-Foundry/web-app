import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DraftMember, DraftTeam } from "@/types/frenzyDraft";
import { RankText } from "./RankText";
import { ZoneOffset, type ViewerZone } from "./ZoneOffset";

interface Props {
  team: DraftTeam;
  target: number;
  pickingNow: number | null;
  moveTargets: DraftTeam[] | null;
  viewer: ViewerZone;
  onMove: (member: DraftMember, teamId: number) => void;
}

const ROW = "grid grid-cols-roster-row items-center gap-2 py-1 text-sm";

/** One team's captain and every member, in a virtual list; staff can move a member after the draft. */
export function TeamRoster({ team, target, pickingNow, moveTargets, viewer, onMove }: Props): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: team.members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 10,
  });

  return (
    <section className={cn("min-w-0 rounded-xl border bg-card p-4", pickingNow !== null ? "border-primary/60" : "border-border")}>
      <header className="mb-2 border-b border-border pb-2">
        <h3 className="truncate font-rs-bold text-lg text-foreground">{team.name}</h3>
        <p className="text-xs text-muted-foreground">{team.members.length + 1} / {target}</p>
      </header>
      <div className={ROW}>
        <span className="text-xs text-muted-foreground">C</span>
        <span className="truncate">
          <b>{team.captain.rsn}</b>
          <ZoneOffset zone={team.captain.timezone} viewer={viewer} />
        </span>
        <span className="text-xs text-muted-foreground">Captain</span>
      </div>
      {pickingNow !== null && (
        <div className={ROW}>
          <span className="text-xs tabular-nums text-muted-foreground">{pickingNow}</span>
          <span className="font-semibold text-primary">Picking now</span>
          <span />
        </div>
      )}
      <div ref={parentRef} className="max-h-88 overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((item) => {
            const m = team.members[item.index]!;
            return (
              <div
                key={m.signup_id}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className={ROW}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${item.start}px)` }}
              >
                <span className="text-xs tabular-nums text-muted-foreground">{m.pick_number}</span>
                <span className="truncate">
                  {m.rsn}
                  <ZoneOffset zone={m.timezone} viewer={viewer} />
                  {m.pick_kind === "auto" && <span className="ml-1.5 text-xs text-muted-foreground">auto</span>}
                </span>
                {moveTargets ? <MoveMenu member={m} targets={moveTargets} onMove={onMove} /> : <RankText rank={m.rank} />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MoveMenu({ member, targets, onMove }: { member: DraftMember; targets: DraftTeam[]; onMove: Props["onMove"] }): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={`Move ${member.rsn}`}>
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move {member.rsn} to</DropdownMenuLabel>
        {targets.map((t) => (
          <DropdownMenuItem key={t.team_id} onSelect={() => onMove(member, t.team_id)}>
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
