interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function FrenzyFilterLine<T extends string>({ label, options, value, onChange }: Props<T>): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" role="group" aria-label={label}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground min-w-16">{label}</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={`border-b-2 pb-0.5 transition-colors ${
            opt.value === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
