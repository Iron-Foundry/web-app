import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useOsrsActivities } from "@/hooks/useFrenzy";
import type { OsrsActivity } from "@/types/frenzy";

interface Props {
  value: string;
  onSelect: (activity: OsrsActivity) => void;
  placeholder?: string;
}

export function ActivityPicker({ value, onSelect, placeholder = "Search activities..." }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: activities } = useOsrsActivities();

  const filtered =
    activities?.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())) ?? [];

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
          {filtered.slice(0, 20).map((activity) => (
            <button
              key={activity.slug}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(activity);
                setQuery(activity.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
            >
              <img
                src={activity.icon_url}
                alt={activity.name}
                className="h-5 w-5 object-contain shrink-0"
              />
              <span className="truncate">{activity.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
