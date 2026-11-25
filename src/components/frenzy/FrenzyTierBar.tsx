export const TIER_BAR_COLORS = ["bg-yellow-500", "bg-sky-500", "bg-purple-500", "bg-teal-500", "bg-rose-500"];
export const TIER_TEXT_COLORS = ["text-yellow-500", "text-sky-500", "text-purple-500", "text-teal-500", "text-rose-500"];

export function tierColor(index: number): string {
  return TIER_BAR_COLORS[index % TIER_BAR_COLORS.length] ?? "bg-muted";
}

export function FrenzyTierBar({ tierPoints, className = "h-1.5" }: { tierPoints: Record<string, number>; className?: string }): React.ReactElement {
  const total = Object.values(tierPoints).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className={`${className} w-full rounded-full bg-muted`} />;
  return (
    <div className={`flex ${className} w-full overflow-hidden rounded-full gap-px bg-muted`}>
      {Object.entries(tierPoints).map(([tier, pts], i) =>
        pts > 0 ? (
          <div key={tier} className={tierColor(i)} style={{ width: `${(pts / total) * 100}%` }} title={`${tier}: ${Math.floor(pts).toLocaleString()} pts`} />
        ) : null,
      )}
    </div>
  );
}

export function FrenzyTierLegend({ tiers }: { tiers: string[] }): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {tiers.map((tier, i) => (
        <span key={tier} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${tierColor(i)}`} />
          {tier}
        </span>
      ))}
    </div>
  );
}
