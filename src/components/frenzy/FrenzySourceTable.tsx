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

export function FrenzySourceTable({ tierName, source, itemProgress, activeMultiplierFactor }: Props) {
  const sourceTotal = source.items.reduce((acc, item) => {
    const key = `${tierName}.${source.name}.${item.name}`;
    return acc + calcItemPoints(item, itemProgress[key] ?? 0);
  }, 0);
  const multiplied = sourceTotal * activeMultiplierFactor;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {source.icon_url && (
              <img src={source.icon_url} alt={source.name} className="h-5 w-5 object-contain" />
            )}
            <span className="font-medium text-sm">{source.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {activeMultiplierFactor > 1 && (
              <Badge variant="secondary" className="text-xs">
                {activeMultiplierFactor.toFixed(2)}x
              </Badge>
            )}
            <span className="text-sm font-semibold">{Math.floor(multiplied).toLocaleString()} pts</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-1">
          {source.items.map((item) => {
            const key = `${tierName}.${source.name}.${item.name}`;
            const obtained = itemProgress[key] ?? 0;
            const pts = calcItemPoints(item, obtained);
            const isComplete = obtained >= item.required;
            const hasDup = item.duplicate_required > 0;

            return (
              <div
                key={item.name}
                className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                  isComplete ? "bg-green-500/10" : obtained > 0 ? "bg-yellow-500/10" : ""
                }`}
              >
                {item.icon_url && (
                  <img src={item.icon_url} alt={item.name} className="h-4 w-4 object-contain shrink-0" />
                )}
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-muted-foreground text-xs shrink-0">
                  {obtained}/{item.required}
                  {hasDup && ` (+${item.duplicate_required} dup)`}
                </span>
                <span className={`text-xs font-medium shrink-0 ${pts > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                  {pts > 0 ? `+${Math.floor(pts)}` : `${item.points} pts`}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
