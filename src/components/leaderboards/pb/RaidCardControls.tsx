import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = [
  { idx: 1, label: "Overall" },
  { idx: 0, label: "Challenge" },
] as const;

/** The ToA Overall and Challenge switch, as underlined words. */
export function ToaVariantSwitch({ value, onChange }: { value: number; onChange: (idx: number) => void }): React.ReactElement {
  return (
    <div className="flex gap-3" role="group" aria-label="ToA variant">
      {VARIANTS.map((v) => (
        <button
          key={v.idx}
          type="button"
          aria-pressed={value === v.idx}
          onClick={() => onChange(v.idx)}
          className={cn(
            "border-b-2 pb-0.5 text-xs transition-colors",
            value === v.idx ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

/** The previous and next team-size buttons around "n / total". */
export function TeamSizePager({ index, total, onStep }: { index: number; total: number; onStep: (dir: "left" | "right") => void }): React.ReactElement {
  const step = "rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={() => onStep("left")} className={step} aria-label="Previous team size"><ChevronLeft className="h-3.5 w-3.5" /></button>
      <span className="w-8 select-none text-center text-xs tabular-nums text-muted-foreground">{index + 1} / {total}</span>
      <button type="button" onClick={() => onStep("right")} className={step} aria-label="Next team size"><ChevronRight className="h-3.5 w-3.5" /></button>
    </div>
  );
}
