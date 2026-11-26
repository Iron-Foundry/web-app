import type { LootRateRow, LootSourceRow } from "@/api/osrsclans";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSourceRates } from "@/hooks/useLootSources";
import { sourceLabel } from "@/lib/lootTable";
import { DropTable } from "./DropTable";
import { KillRateBlock } from "./KillRateBlock";

interface Props {
  source: LootSourceRow | null;
  canEdit: boolean;
  onClose: () => void;
}

function facts(rows: LootRateRow[] | undefined): string {
  const read = rows?.[0]?.read_at;
  return rows ? `${rows.length} rows${read ? ` · read ${read.slice(0, 10)}` : ""}` : "";
}

function SourceRates({ rows, isError }: { rows: LootRateRow[] | undefined; isError: boolean }): React.ReactElement {
  if (isError) return <p className="text-sm text-destructive">OSRSClans did not answer.</p>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading drops...</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">OSRSClans has no drops for this source.</p>;
  return (
    <div className="max-h-72 space-y-3 overflow-y-auto">
      <DropTable rows={rows} />
    </div>
  );
}

/** One drop source: its kill rate above its drop table. */
export function SourceDialog({ source, canEdit, onClose }: Props): React.ReactElement {
  const { data: rows, isError } = useSourceRates(source?.source ?? null);
  return (
    <Dialog open={source !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {source && (
          <>
            <DialogHeader>
              <DialogTitle>{sourceLabel(source.source)}</DialogTitle>
              <DialogDescription>{facts(rows)}</DialogDescription>
            </DialogHeader>
            <KillRateBlock source={source} canEdit={canEdit} />
            <SourceRates rows={rows} isError={isError} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
