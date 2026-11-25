import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useItemLootRates } from "@/hooks/useOsrsClans";
import { measuredBy, rateSourceLabel } from "@/lib/frenzyCard";
import { byHours, rowChance, rowHours } from "@/lib/frenzyRate";
import type { LootRateRow } from "@/api/osrsclans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  current: string | null | undefined;
  onPick: (row: LootRateRow) => void;
  onByHand: () => void;
}

function RateRow({ row, picked, onPick }: { row: LootRateRow; picked: boolean; onPick: () => void }): React.ReactElement {
  const chance = rowChance(row);
  const hours = rowHours(row);
  return (
    <button
      type="button"
      onClick={onPick}
      className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${picked ? "bg-muted" : ""}`}
    >
      <span className="truncate font-medium">{rateSourceLabel(row.source)}</span>
      <span className={`tabular-nums ${hours === null ? "text-yellow-500" : ""}`}>
        {hours === null ? "No kill rate" : `${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} h a drop`}
      </span>
      <span className="col-span-2 text-xs text-muted-foreground">
        {chance ? `1/${Math.round(1 / chance).toLocaleString()}` : "-"}
        {row.kills_per_hour ? ` · ${row.kills_per_hour}/h (${measuredBy(row.kill_rate_source)})` : ""}
        {row.chance_per_raid ? " · chance a raid" : ""}
      </span>
    </button>
  );
}

export function RatePickerDialog({ open, onOpenChange, itemName, current, onPick, onByHand }: Props): React.ReactElement {
  const { data: rows, isLoading, isError } = useItemLootRates(itemName, open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rate source: {itemName}</DialogTitle>
          <DialogDescription>OSRSClans loot rates, fastest first.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 space-y-0.5 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {isError && <p className="text-sm text-destructive">OSRSClans did not answer.</p>}
          {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">OSRSClans has no source for this item.</p>}
          {rows &&
            byHours(rows).map((row) => (
              <RateRow
                key={row.source}
                row={row}
                picked={row.source === current}
                onPick={() => {
                  onPick(row);
                  onOpenChange(false);
                }}
              />
            ))}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            onByHand();
            onOpenChange(false);
          }}
        >
          Set the rate by hand
        </Button>
      </DialogContent>
    </Dialog>
  );
}
