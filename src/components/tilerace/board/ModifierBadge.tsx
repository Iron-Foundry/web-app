import type { CellModifier } from "@/types/tilerace";
import { describeModifier } from "@/lib/tilerace-modifiers";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ModifierBadgeProps {
  modifier: CellModifier;
}

export function ModifierBadge({ modifier }: ModifierBadgeProps): JSX.Element {
  const info = describeModifier(modifier);

  return (
    <HoverCard openDelay={100} closeDelay={50}>
      <HoverCardTrigger asChild>
        <span className="h-3 w-3 rounded-full bg-primary/80 text-[7px] text-primary-foreground flex items-center justify-center leading-none cursor-help overflow-hidden">
          {info.iconUrl ? (
            <img src={info.iconUrl} alt={info.label} className="h-full w-full object-contain" />
          ) : (
            info.symbol
          )}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-64 space-y-2">
        <p className="font-rs-bold text-sm text-primary">{info.label}</p>
        <p className="text-xs text-muted-foreground">{info.summary}</p>
        {info.params.length > 0 && (
          <ul className="space-y-1 pt-1 border-t border-border/60">
            {info.params.map((p) => (
              <li key={p.label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-medium">{p.value}</span>
              </li>
            ))}
          </ul>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
