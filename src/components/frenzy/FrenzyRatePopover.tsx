import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { hoursPerDrop, isTypedCard, measuredBy, rateSourceLabel } from "@/lib/frenzyCard";
import type { FrenzyItem, FrenzySource } from "@/types/frenzy";

function chance(item: FrenzyItem): string {
  return item.drop_denom ? `1/${item.drop_denom.toLocaleString()}` : "-";
}

function aDrop(item: FrenzyItem): string {
  const hours = hoursPerDrop(item);
  return hours === null ? "-" : `${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} h`;
}

function itemSource(item: FrenzyItem): string {
  const where = item.rate_source ? rateSourceLabel(item.rate_source) : "No source";
  return item.kph ? `${where} · ${item.kph}/h` : `${where} · no kill rate`;
}

function SourceFacts({ item }: { item: FrenzyItem }): React.ReactElement {
  if (!item.kph) return <p className="text-yellow-500">OSRSClans has no kill rate for this source.</p>;
  return (
    <>
      <p className="flex justify-between gap-3">
        <span className="text-muted-foreground">{item.rate_category === "raid" ? "Raids per hour" : "Kills per hour"}</span>
        <span className="font-medium">{item.kph}</span>
      </p>
      <p className="flex justify-between gap-3">
        <span className="text-muted-foreground">Measured by</span>
        <span className="font-medium">{measuredBy(item.kill_rate_source)}</span>
      </p>
    </>
  );
}

export function FrenzyRatePopover({ source }: { source: FrenzySource }): React.ReactElement {
  const typed = isTypedCard(source);
  const first = source.items[0];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Rates for ${source.name}`}
          className="inline-grid h-7 w-7 place-items-center rounded-full border text-muted-foreground hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-muted"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2 text-xs">
        {!typed && first && <SourceFacts item={first} />}
        <table className="w-full">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 text-left font-medium">Item</th>
              <th className="py-1 text-right font-medium">Chance</th>
              <th className="py-1 text-right font-medium">A drop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {source.items.map((item) => (
              <tr key={item.name}>
                <td className="py-1.5 pr-2">
                  {item.name}
                  {typed && <span className="block text-muted-foreground">{itemSource(item)}</span>}
                </td>
                <td className="py-1.5 text-right tabular-nums">{chance(item)}</td>
                <td className="py-1.5 text-right tabular-nums">{aDrop(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
}
