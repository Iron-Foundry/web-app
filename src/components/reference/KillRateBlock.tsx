import { useState } from "react";
import type { LootSourceRow } from "@/api/osrsclans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKillRate, useRemoveKillRate, useSetKillRate } from "@/hooks/useLootSources";
import { measuredBy } from "@/lib/frenzyCard";
import { parseKillsPerHour } from "@/lib/lootTable";

interface Props {
  source: LootSourceRow;
  canEdit: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StaffRateNote({ source }: { source: string }): React.ReactElement {
  const { data, isPending, isError } = useKillRate(source);
  if (isPending) return <>Loading who set it...</>;
  if (isError) return <span className="text-destructive">Could not load who set it.</span>;
  return <>Foundry rate, set by {data.set_by_name ?? "a removed member"}, {formatDate(data.updated_at)}.</>;
}

function RateEditor({ source, isFoundry }: { source: LootSourceRow; isFoundry: boolean }): React.ReactElement {
  const [text, setText] = useState(isFoundry && source.kills_per_hour ? String(source.kills_per_hour) : "");
  const setRate = useSetKillRate();
  const removeRate = useRemoveKillRate();
  const value = parseKillsPerHour(text);
  const failed = setRate.error ?? removeRate.error;
  return (
    <>
      <div className="flex items-center gap-2">
        <Input className="h-8 w-28" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="Kills/h" />
        <span className="text-sm text-muted-foreground">an hour</span>
        <span className="flex-1" />
        {isFoundry && (
          <Button size="sm" variant="outline" disabled={removeRate.isPending} onClick={() => removeRate.mutate({ source: source.source })}>
            Remove
          </Button>
        )}
        <Button
          size="sm"
          disabled={value === null || setRate.isPending}
          onClick={() => value !== null && setRate.mutate({ source: source.source, killsPerHour: value })}
        >
          Save
        </Button>
      </div>
      {failed && <p className="text-xs text-destructive">{failed.message}</p>}
    </>
  );
}

/** The kill rate of a source: OSRSClans', Foundry's, or none, with the staff controls. */
export function KillRateBlock({ source, canEdit }: Props): React.ReactElement {
  const isFoundry = source.kill_rate_source === "foundry";
  const hasOwnRate = source.kills_per_hour != null && !isFoundry;
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Kill rate</p>
      <p className="text-xs text-muted-foreground">
        {hasOwnRate && `${source.kills_per_hour} an hour, measured by ${measuredBy(source.kill_rate_source)}.`}
        {isFoundry && <StaffRateNote source={source.source} />}
        {source.kills_per_hour == null && "OSRSClans gives none."}
      </p>
      {canEdit && !hasOwnRate && <RateEditor key={source.kills_per_hour ?? "none"} source={source} isFoundry={isFoundry} />}
    </div>
  );
}
