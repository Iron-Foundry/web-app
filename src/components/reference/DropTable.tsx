import type { LootRateRow } from "@/api/osrsclans";
import { rowHours } from "@/lib/frenzyRate";
import { chanceLabel, groupRows, quantityLabel } from "@/lib/lootTable";

const HEAD = "text-[10px] uppercase tracking-wider text-muted-foreground/50";
const CELL = "py-1.5 px-2 text-right tabular-nums text-muted-foreground";

function hoursLabel(row: LootRateRow): string {
  const hours = rowHours(row);
  return hours === null ? "-" : `${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} h`;
}

function DropRow({ row }: { row: LootRateRow }): React.ReactElement {
  const line = row.lines[0];
  return (
    <tr>
      <td className="py-1.5 pr-2">
        <span className="flex items-center gap-1.5">
          {row.image_url && <img src={row.image_url} alt={row.item_name} className="h-4 w-4 shrink-0 object-contain" />}
          {row.item_name}
        </span>
      </td>
      <td className={CELL}>{line ? quantityLabel(line) : "-"}</td>
      <td className={CELL}>{line?.rarity ?? "-"}</td>
      <td className={CELL}>{chanceLabel(row)}</td>
      <td className={CELL}>{hoursLabel(row)}</td>
      <td className="py-1.5 pl-2 text-right tabular-nums text-muted-foreground">
        {row.ge_price != null ? `${row.ge_price.toLocaleString()} gp` : "-"}
      </td>
    </tr>
  );
}

/** One source's loot rate rows, under the Wiki's own drop table headings. */
export function DropTable({ rows }: { rows: LootRateRow[] }): React.ReactElement {
  return (
    <>
      {groupRows(rows).map(([group, members]) => (
        <div key={group}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group}</p>
          <table className="w-full text-xs">
            <thead>
              <tr className={HEAD}>
                <th className="py-1 pr-2 text-left font-medium">Item</th>
                <th className="py-1 px-2 text-right font-medium">Qty</th>
                <th className="py-1 px-2 text-right font-medium">Rarity</th>
                <th className="py-1 px-2 text-right font-medium">Chance/kill</th>
                <th className="py-1 px-2 text-right font-medium">Hours a drop</th>
                <th className="py-1 pl-2 text-right font-medium">GE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {members.map((row, index) => (
                <DropRow key={`${row.item_name}-${index}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
