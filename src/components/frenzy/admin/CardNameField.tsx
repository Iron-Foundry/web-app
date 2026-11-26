import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useCollectionLogPages } from "@/hooks/useOsrsClans";

interface Props {
  value: string;
  onChange: (name: string) => void;
  onPickPage: (page: string) => void;
}

/** The card name: free text, with the matching collection log pages listed below it to pick from. */
export function CardNameField({ value, onChange, onPickPage }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const term = useDebounce(value.trim(), 300);
  const { data: pages } = useCollectionLogPages(term);
  const shown = open && (pages?.length ?? 0) > 0;
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Zulrah, Slayer, Miscellaneous..."
        className="h-8 text-sm"
      />
      {shown && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
          {pages!.map((page) => (
            <button
              key={page.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPickPage(page.name);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
            >
              <span className="truncate">{page.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {page.sources === 1 ? "1 source" : `${page.sources} sources`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
