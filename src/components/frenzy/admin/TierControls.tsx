import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FrenzyTierData } from "@/types/frenzyTemplate";

interface Props {
  name: string;
  data: FrenzyTierData;
  first: boolean;
  last: boolean;
  onMove: (step: -1 | 1) => void;
  onMultiplier: (value: number | undefined) => void;
}

/** A tier's points multiplier and its move up and down buttons. */
export function TierControls({ name, data, first, last, onMove, onMultiplier }: Props): React.ReactElement {
  return (
    <span className="flex items-center gap-1">
      <span className="text-xs font-normal text-muted-foreground">Points ×</span>
      <Input type="number" min={0} step={0.05} value={data.multiplier ?? 1} aria-label={`${name} points multiplier`}
        onChange={(e) => onMultiplier(Number(e.target.value) || undefined)} className="h-6 w-16 px-1.5 text-xs" />
      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={first} onClick={() => onMove(-1)} title={`Move ${name} up`}>
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={last} onClick={() => onMove(1)} title={`Move ${name} down`}>
        <ChevronDown className="h-3 w-3" />
      </Button>
    </span>
  );
}
