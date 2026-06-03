import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useOsrsItems } from "@/hooks/useFrenzy";
import type { OsrsItem } from "@/types/frenzy";

interface Props {
  value: string;
  onSelect: (item: OsrsItem) => void;
  placeholder?: string;
}

export function ItemPicker({ value, onSelect, placeholder = "Search items..." }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: items } = useOsrsItems(query);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
      {open && (items?.length ?? 0) > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {items!.map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setQuery(item.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
            >
              <img src={item.icon_url} alt={item.name} className="h-5 w-5 object-contain shrink-0" />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
