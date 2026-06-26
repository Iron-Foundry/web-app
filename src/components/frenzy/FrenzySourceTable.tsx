import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calcItemPoints } from "@/lib/frenzy";
import type { FrenzySource } from "@/types/frenzy";

interface Props {
  tierName: string;
  source: FrenzySource;
  itemProgress: Record<string, number>;
  activeMultiplierFactor: number;
}

function BasePips({ required, obtained }: { required: number; obtained: number }) {
  if (required > 8) {
    return (
      <span className="text-xs text-muted-foreground shrink-0">
        {Math.min(obtained, required)}/{required}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {Array.from({ length: required }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full border transition-colors ${
            i < obtained ? "bg-sky-400 border-sky-400" : "bg-transparent border-sky-400/50"
          }`}
        />
      ))}
    </div>
  );
}

function DupIndicator({
  dupRequired,
  dupObtained,
  dupPoints,
  baseComplete,
}: {
  dupRequired: number;
  dupObtained: number;
  dupPoints: number;
  baseComplete: boolean;
}) {
  const earned = dupObtained >= dupRequired;
  const active = baseComplete;

  return (
    <div
      className={`flex items-center gap-1 shrink-0 transition-opacity ${
        active ? "opacity-100" : "opacity-30"
      }`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: dupRequired }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full border transition-colors ${
              i < dupObtained ? "bg-primary border-primary" : "bg-transparent border-primary/95"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold ${earned ? "text-primary" : "text-primary/95"}`}>
        +{dupPoints}
      </span>
    </div>
  );
}

export function FrenzySourceTable({ tierName, source, itemProgress, activeMultiplierFactor }: Props) {
  const sourceTotal = source.items.reduce((acc, item) => {
    const key = `${tierName}.${source.name}.${item.name}`;
    return acc + calcItemPoints(item, itemProgress[key] ?? 0);
  }, 0);
  const multiplied = sourceTotal * activeMultiplierFactor;

  const obtainedCount = source.items.filter((item) => {
    const key = `${tierName}.${source.name}.${item.name}`;
    return (itemProgress[key] ?? 0) >= item.required;
  }).length;

  const completionPct = source.items.length > 0 ? (obtainedCount / source.items.length) * 100 : 0;
  const allComplete = obtainedCount === source.items.length;

  return (
    <Card className={allComplete ? "border-green-500/40" : ""}>
      <CardHeader className="pb-0 pt-3 px-4">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            {source.icon_url && (
              <img src={source.icon_url} alt={source.name} className="h-6 w-6 object-contain" />
            )}
            <span className="font-semibold text-sm">{source.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {obtainedCount}/{source.items.length}
            </span>
            {activeMultiplierFactor > 1 && (
              <Badge variant="secondary" className="text-xs">
                {activeMultiplierFactor.toFixed(2)}x
              </Badge>
            )}
            <span className="text-sm font-semibold">{Math.floor(multiplied).toLocaleString()} pts</span>
          </div>
        </div>
        <div className="h-0.5 w-full bg-muted rounded-full -mx-4 px-4 overflow-hidden" style={{ width: "calc(100% + 2rem)", marginLeft: "-1rem" }}>
          <div
            className={`h-full rounded-full transition-all ${allComplete ? "bg-green-500" : "bg-primary/60"}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-2">
        <div className="space-y-1">
          {source.items.map((item) => {
            const key = `${tierName}.${source.name}.${item.name}`;
            const obtained = itemProgress[key] ?? 0;
            const pts = calcItemPoints(item, obtained);
            const isComplete = obtained >= item.required;
            const isPartial = !isComplete && obtained > 0;
            const dupObtained = isComplete
              ? Math.min(obtained - item.required, item.duplicate_required)
              : 0;

            return (
              <div
                key={item.name}
                className={`flex items-center gap-2 rounded-sm border-l-2 pl-2 pr-2 py-1.5 text-sm ${
                  isComplete
                    ? "border-l-green-500 bg-green-500/5"
                    : isPartial
                      ? "border-l-amber-500 bg-amber-500/5"
                      : "border-l-transparent"
                }`}
              >
                {item.icon_url && (
                  <img src={item.icon_url} alt={item.name} className="h-5 w-5 object-contain shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm">{item.name}</span>
                  {item.drop_denom != null && item.kph != null && item.kph > 0 && (
                    <span className="text-[10px] text-muted-foreground leading-none">
                      1/{item.drop_denom.toLocaleString()} @ {item.kph}kph &rarr;{" "}
                      {(item.drop_denom / item.kph).toFixed(1)}h/drop
                    </span>
                  )}
                </div>
                <BasePips required={item.required} obtained={obtained} />
                <span
                  className={`text-xs font-semibold shrink-0 min-w-[2.5rem] text-right ${
                    pts > 0 ? "text-green-500" : "text-sky-700"
                  }`}
                >
                  {pts > 0 ? `+${Math.floor(pts)}` : `+${item.points}`}
                </span>
                {item.duplicate_required > 0 && (
                  <DupIndicator
                    dupRequired={item.duplicate_required}
                    dupObtained={dupObtained}
                    dupPoints={Math.round(item.points / 2)}
                    baseComplete={isComplete}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
