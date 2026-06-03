import { Badge } from "@/components/ui/badge";
import { isMultiplierUnlocked } from "@/lib/frenzy";
import type { FrenzyMultiplier } from "@/types/frenzy";
import { Lock, Unlock } from "lucide-react";

interface Props {
  multipliers: FrenzyMultiplier[];
  itemProgress: Record<string, number>;
}

export function FrenzyMultiplierPanel({ multipliers, itemProgress }: Props) {
  if (multipliers.length === 0) {
    return <p className="text-sm text-muted-foreground">No multipliers configured.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {multipliers.map((m) => {
        const unlocked = isMultiplierUnlocked(m, itemProgress);
        return (
          <div
            key={m.name}
            className={`rounded-lg border p-3 ${
              unlocked ? "border-green-500/50 bg-green-500/5" : "bg-card"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {unlocked ? (
                <Unlock className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium text-sm">{m.name}</span>
              <Badge variant={unlocked ? "default" : "secondary"} className="ml-auto text-xs">
                ×{m.factor}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{m.description}</p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Requires:</p>
              {m.requirement.map((req) => {
                const obtained = (itemProgress[req] ?? 0) > 0;
                return (
                  <div key={req} className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${obtained ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <span className={`text-xs ${obtained ? "text-foreground" : "text-muted-foreground"}`}>{req}</span>
                  </div>
                );
              })}
              {m.affects.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Applies to: {m.affects.join(", ")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
