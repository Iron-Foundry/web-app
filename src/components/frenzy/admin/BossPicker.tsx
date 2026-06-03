import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useOsrsBosses } from "@/hooks/useFrenzy";
import type { OsrsBoss } from "@/types/frenzy";

interface Props {
  value: string;
  onSelect: (boss: OsrsBoss) => void;
  placeholder?: string;
}

export function BossPicker({ value, onSelect, placeholder = "Search bosses..." }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: bosses } = useOsrsBosses();

  const filtered = bosses?.filter((b) => b.name.toLowerCase().includes(query.toLowerCase())) ?? [];

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map((boss) => (
            <button
              key={boss.slug}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(boss);
                setQuery(boss.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
            >
              <img src={boss.icon_url} alt={boss.name} className="h-5 w-5 object-contain shrink-0" />
              <span className="truncate">{boss.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
