import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: ReactNode;
  action?: ReactNode;
  more?: { label: string; onClick: () => void } | null;
  className?: string;
  children: ReactNode;
}

/** A flat bordered panel with a heading, an optional action and an optional "show more" foot. */
export function Panel({ title, action, more, className, children }: PanelProps): React.ReactElement {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-rs-bold text-xl text-foreground">{title}</h2>
        {action}
      </div>
      {children}
      {more && (
        <button
          type="button"
          onClick={more.onClick}
          className="mt-2 w-full border-t border-border pt-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {more.label}
        </button>
      )}
    </section>
  );
}
