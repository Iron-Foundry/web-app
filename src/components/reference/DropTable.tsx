import { useLootSource } from "@/hooks/useReference";
import type { LootDrop } from "@/types/reference";
import { chanceLabel, rarityLabel } from "@/lib/droprate";

function quantityLabel(drop: LootDrop): string {
  const range =
    drop.quantity_low === drop.quantity_high
      ? `${drop.quantity_low}`
      : `${drop.quantity_low}-${drop.quantity_high}`;
  return drop.noted ? `${range} (noted)` : range;
}

function groupDrops(drops: LootDrop[]): [string, LootDrop[]][] {
  const order: string[] = [];
  const groups = new Map<string, LootDrop[]>();
  for (const drop of drops) {
    const existing = groups.get(drop.drop_group);
    if (existing) {
      existing.push(drop);
    } else {
      groups.set(drop.drop_group, [drop]);
      order.push(drop.drop_group);
    }
  }
  return order.map((group) => [group, groups.get(group) ?? []]);
}

export function DropTable({ slug }: { slug: string }) {
  const { data, isPending, isError } = useLootSource(slug);

  if (isPending)
    return <p className="px-3 py-2 text-xs text-muted-foreground">Loading drops...</p>;
  if (isError || !data)
    return <p className="px-3 py-2 text-xs text-red-500">Failed to load drops.</p>;
  if (data.drops.length === 0)
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        No drops parsed for this source yet.
      </p>
    );

  const isChest = data.reward_kind === "chest";
  const chanceHeader = isChest ? "Chance/roll" : "Chance/kill";

  return (
    <div className="space-y-3 bg-muted/20 p-3">
      {isChest && (
        <p className="text-[11px] text-muted-foreground/70">
          Rarities are per reward-chest roll from the wiki; point-scaling (raid points,
          reward potential) is not modelled.
        </p>
      )}
      {groupDrops(data.drops).map(([group, drops]) => (
        <div key={group || "drops"}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {group || "Drops"}
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                <th className="py-1 pr-2 text-left font-medium">Item</th>
                <th className="py-1 px-2 text-right font-medium">Qty</th>
                <th className="py-1 px-2 text-right font-medium">Rarity</th>
                <th className="py-1 px-2 text-right font-medium">{chanceHeader}</th>
                <th className="py-1 pl-2 text-right font-medium">GE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {drops.map((drop, index) => (
                <tr key={`${drop.item_name}-${index}`}>
                  <td className="py-1.5 pr-2">{drop.item_name}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                    {quantityLabel(drop)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                    {rarityLabel(drop)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
                    {chanceLabel(drop)}
                  </td>
                  <td className="py-1.5 pl-2 text-right tabular-nums text-muted-foreground">
                    {drop.ge_price != null ? `${drop.ge_price.toLocaleString()} gp` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
