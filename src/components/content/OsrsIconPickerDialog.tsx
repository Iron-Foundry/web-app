import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { API_URL } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { osrsCacheApi } from "@/api/osrsCache";
import { buildImageMarkup } from "@/lib/guideAssets";

interface OsrsIconPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (markup: string) => void;
}

interface IconResult {
  key: string;
  name: string;
  url: string;
}

const ICON_WIDTHS = [20, 24, 32, 48, 64] as const;

const tabTrigger = cn(
  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

export function OsrsIconPickerDialog({ open, onClose, onSelect }: OsrsIconPickerDialogProps) {
  const [tab, setTab] = useState("items");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IconResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IconResult | null>(null);
  const [inline, setInline] = useState(true);
  const [width, setWidth] = useState(24);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setInline(true);
    setWidth(24);
  }, [open, tab]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    let active = true;
    setLoading(true);
    const load = tab === "items"
      ? osrsCacheApi.listItems(60, 0, q || undefined).then((items) =>
          items
            .filter((i) => i.icon_url)
            .map((i) => ({
              key: `i${i.item_id}`,
              name: i.name,
              url: `${API_URL}/osrs-cache${i.icon_url}`,
            })),
        )
      : osrsCacheApi.listSprites(60, 0, { search: q || undefined }).then((sprites) =>
          sprites.map((s) => ({
            key: `s${s.sprite_id}-${s.frame_index}`,
            name: s.name ?? `Sprite ${s.sprite_id}`,
            url: `${API_URL}/osrs-cache${s.png_url}`,
          })),
        );
    load
      .then((r) => active && setResults(r))
      .catch(() => active && setResults([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, tab, query]);

  function handleInsert() {
    if (!selected) return;
    onSelect(buildImageMarkup({ url: selected.url, alt: selected.name, width, inline }));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Insert OSRS Icon</DialogTitle>
        </DialogHeader>

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List className="flex gap-1 border border-border rounded-md bg-muted/40 p-1">
            <Tabs.Trigger value="items" className={tabTrigger}>Items</Tabs.Trigger>
            <Tabs.Trigger value="sprites" className={tabTrigger}>Sprites</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <Input
          placeholder="Search by name or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-sm"
          autoFocus
        />

        <div className="grid grid-cols-8 gap-1 h-56 overflow-y-auto rounded-md border border-border p-2 content-start">
          {loading ? (
            <p className="col-span-8 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : results.length === 0 ? (
            <p className="col-span-8 py-8 text-center text-sm text-muted-foreground">No icons found.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.key}
                type="button"
                title={r.name}
                onClick={() => setSelected(r)}
                className={cn(
                  "flex items-center justify-center h-11 rounded border transition-colors",
                  selected?.key === r.key
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <img src={r.url} alt={r.name} loading="lazy" className="max-h-9 max-w-9 object-contain" />
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
            <input type="checkbox" checked={inline} onChange={(e) => setInline(e.target.checked)} className="rounded" />
            Inline in text
          </label>
          <span className="text-xs text-muted-foreground ml-2">Width:</span>
          {ICON_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              className={cn(
                "text-xs px-2 py-1 rounded border transition-colors",
                width === w
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40",
              )}
            >
              {w}
            </button>
          ))}
          <Input
            type="number"
            min={1}
            value={width}
            onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
            className="h-7 w-16 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {selected && (
            <span className="text-xs text-muted-foreground truncate">
              {inline ? "Flows inline: " : "Block image: "}
              <span className="text-foreground">{selected.name}</span>
            </span>
          )}
          <Button size="sm" onClick={handleInsert} disabled={!selected} className="ml-auto">
            Insert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
