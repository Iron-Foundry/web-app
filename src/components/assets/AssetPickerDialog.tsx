import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAssetPickerResults, type AssetResult } from "./useAssetPickerResults";

interface AssetPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const tabTrigger = cn(
  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

export function AssetPickerDialog({ open, onClose, onSelect }: AssetPickerDialogProps) {
  const [tab, setTab] = useState("items");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AssetResult | null>(null);
  const { results, loading, gridRef, sentinelRef } = useAssetPickerResults(open, tab, query);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(null);
  }, [open, tab]);

  function handleInsert() {
    if (!selected) return;
    onSelect(selected.url);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Choose Icon</DialogTitle>
        </DialogHeader>

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List className="flex gap-1 border border-border rounded-md bg-muted/40 p-1">
            <Tabs.Trigger value="items" className={tabTrigger}>Items</Tabs.Trigger>
            <Tabs.Trigger value="sprites" className={tabTrigger}>Sprites</Tabs.Trigger>
            <Tabs.Trigger value="uploaded" className={tabTrigger}>Uploaded</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <Input
          placeholder="Search by name or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-sm"
          autoFocus
        />

        <div ref={gridRef} className="grid grid-cols-8 gap-1 h-56 overflow-y-auto rounded-md border border-border p-2 content-start">
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
          <div ref={sentinelRef} className="col-span-8 h-px" />
        </div>

        <div className="flex items-center gap-2">
          {selected && (
            <span className="text-xs text-muted-foreground truncate">
              Selected: <span className="text-foreground">{selected.name}</span>
            </span>
          )}
          <Button size="sm" onClick={handleInsert} disabled={!selected} className="ml-auto">
            Use icon
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
