import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Fact {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  isScore?: boolean;
  valueClass?: string;
}

/** Figures in one strip, a label over each value. A fact with no value is left out by the caller. */
export function FactStrip({ facts }: { facts: Fact[] }): React.ReactElement | null {
  if (facts.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      {facts.map((f) => (
        <div key={f.label} className="grid min-w-0 gap-1 bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{f.label}</dt>
          <dd
            className={cn(
              "truncate font-semibold text-foreground",
              f.isScore && "font-rs-bold font-normal text-lg text-primary",
              f.valueClass,
            )}
          >
            {f.value}
            {f.sub && <span className="font-normal text-muted-foreground"> {f.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
