import { cn } from "@/lib/utils";

interface Tab<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  tabs: readonly Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Tabs as plain text over a rule, the picked one underlined in the accent. */
export function UnderlineTabs<T extends string>({ tabs, value, onChange, label, className }: Props<T>): React.ReactElement {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-7 border-b border-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px border-b-2 pb-3 text-sm transition-colors motion-reduce:transition-none",
            value === tab.value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
