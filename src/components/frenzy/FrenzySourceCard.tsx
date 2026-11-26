import { calcItemPoints } from "@/lib/frenzy";
import { STATE_TEXT, cardState, isTypedCard, itemKey, itemState } from "@/lib/frenzyCard";
import { FrenzyRatePopover } from "./FrenzyRatePopover";
import type { FrenzyItem, FrenzySource } from "@/types/frenzyTemplate";

interface Props {
  tierName: string;
  source: FrenzySource;
  itemProgress: Record<string, number>;
  factor: number;
}

export function FrenzyCardImage({ source }: { source: FrenzySource }): React.ReactElement {
  if (source.icon_url) return <img src={source.icon_url} alt={source.name} className="h-18 w-18 object-contain" />;
  if (isTypedCard(source)) {
    return (
      <div role="img" aria-label={`${source.name}: ${source.items.length} items`} className="grid h-18 w-18 grid-cols-2 place-items-center gap-0.5 rounded-md bg-muted p-1">
        {source.items.slice(0, 4).map((item) =>
          item.icon_url ? <img key={item.name} src={item.icon_url} alt={item.name} className="h-7 w-7 object-contain" /> : <span key={item.name} />,
        )}
      </div>
    );
  }
  return <div role="img" aria-label={`${source.name} has no image`} className="h-18 w-18 rounded-md bg-muted" />;
}

function Pips({ total, filled }: { total: number; filled: number }): React.ReactElement {
  if (total > 8) return <span className="text-xs text-muted-foreground tabular-nums">{Math.min(filled, total)}/{total}</span>;
  return (
    <span className="flex gap-0.5" title={`${Math.min(filled, total)}/${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < filled ? "bg-green-500" : "bg-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

function ItemRow({ item, obtained }: { item: FrenzyItem; obtained: number }): React.ReactElement {
  const state = itemState(item, obtained);
  const earned = calcItemPoints(item, obtained);
  return (
    <li className="flex items-center gap-2.5 rounded-md bg-muted/40 px-2 py-1.5 text-sm">
      {item.icon_url ? <img src={item.icon_url} alt={item.name} className="h-6 w-6 object-contain shrink-0" /> : <span className="h-6 w-6 shrink-0" />}
      <span className={`flex-1 min-w-0 truncate ${STATE_TEXT[state]}`}>{item.name}</span>
      <Pips total={item.required + Math.max(0, item.duplicate_required)} filled={obtained} />
      <span className={`w-12 text-right text-xs font-semibold tabular-nums ${earned > 0 ? STATE_TEXT[state] : "text-muted-foreground"}`}>
        +{earned > 0 ? earned : item.points}
      </span>
    </li>
  );
}

export function FrenzySourceCard({ tierName, source, itemProgress, factor }: Props): React.ReactElement {
  const obtained = (item: FrenzyItem): number => itemProgress[itemKey(tierName, source.name, item.name)] ?? 0;
  const states = source.items.map((item) => itemState(item, obtained(item)));
  const done = states.filter((s) => s !== "none").length;
  const points = source.items.reduce((acc, item) => acc + calcItemPoints(item, obtained(item)), 0) * factor;
  const total = source.items.length;
  return (
    <article className="rounded-xl border bg-card p-4 space-y-3" title={source.hovertext || undefined}>
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
        <FrenzyCardImage source={source} />
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <div>
            <h3 className={`font-rs-bold text-lg leading-tight ${STATE_TEXT[cardState(states)]}`}>{source.name}</h3>
            <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
              <span>{done}/{total}</span>
              {factor > 1 && <span className="font-semibold text-yellow-500">{factor.toFixed(2)}x</span>}
              <span>{Math.floor(points).toLocaleString()} pts</span>
            </p>
          </div>
          <div className="flex justify-end">
            <FrenzyRatePopover source={source} />
          </div>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <ul className="space-y-1">
        {source.items.map((item) => (
          <ItemRow key={item.name} item={item} obtained={obtained(item)} />
        ))}
      </ul>
    </article>
  );
}
