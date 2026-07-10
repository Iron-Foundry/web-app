import { useEffect, useState, type CSSProperties } from "react";
import { Tabs } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import {
  RUNELITE_OBJECT_TYPES,
  getObjectType,
  objectTypeLabel,
  objectSummary,
} from "@/components/runelite/objectTypes";
import { GlowTuner } from "@/components/runelite/GlowTuner";
import {
  DEFAULT_GLOW,
  encodeGlow,
  glowToFilter,
  isDefaultGlow,
} from "@/components/runelite/glow";
import type { RuneLiteConfig } from "@/types/runeliteConfig";

interface RuneLiteObjectPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (syntax: string) => void;
}

const tabTrigger = cn(
  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

export function RuneLiteObjectPickerDialog({
  open,
  onClose,
  onSelect,
}: RuneLiteObjectPickerDialogProps) {
  const [activeType, setActiveType] = useState("all");
  const [configs, setConfigs] = useState<RuneLiteConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RuneLiteConfig | null>(null);
  const [glow, setGlow] = useState(DEFAULT_GLOW);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setSearch("");
    setActiveType("all");
    setGlow(DEFAULT_GLOW);
    setLoading(true);
    runeliteConfigsApi
      .list()
      .then(setConfigs)
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = configs.filter((config) => {
    if (activeType !== "all" && config.type !== activeType) return false;
    if (search.trim()) return config.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const selectedType = selected ? getObjectType(selected.type) : undefined;
  const SelectedPreview = selectedType?.preview;
  const supportsGlow = selectedType?.supportsGlow ?? false;
  const glowSpec = supportsGlow && !isDefaultGlow(glow) ? encodeGlow(glow) : undefined;
  const embed = selected ? selectedType?.embed(selected.id, glowSpec) : undefined;
  const glowStyle = supportsGlow
    ? ({ "--item-glow": glowToFilter(glow) } as CSSProperties)
    : undefined;

  function handleInsert() {
    if (embed) {
      onSelect(embed);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[94vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Insert RuneLite Object</DialogTitle>
        </DialogHeader>

        <Tabs.Root value={activeType} onValueChange={setActiveType}>
          <Tabs.List className="flex gap-1 border border-border rounded-md bg-muted/40 p-1">
            <Tabs.Trigger value="all" className={tabTrigger}>
              All
            </Tabs.Trigger>
            {RUNELITE_OBJECT_TYPES.map((type) => (
              <Tabs.Trigger key={type.value} value={type.value} className={tabTrigger}>
                {type.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <div className="mt-1 flex gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              placeholder="Search objects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="h-[34rem] overflow-y-auto rounded-md border border-border">
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {configs.length === 0 ? "No objects stored." : "No results."}
                </p>
              ) : (
                <div className="space-y-0.5 p-1">
                  {filtered.map((config) => (
                    <button
                      key={config.id}
                      onClick={() => setSelected(config)}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left transition-colors",
                        selected?.id === config.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span className="block text-sm">{config.name}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {objectTypeLabel(config.type)} - {objectSummary(config)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-[32rem] shrink-0 flex-col gap-3">
            <div className="h-[26rem] overflow-hidden rounded-md border border-border" style={glowStyle}>
              {selected && SelectedPreview ? (
                <SelectedPreview config={selected} />
              ) : (
                <p className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                  Select an object to preview.
                </p>
              )}
            </div>

            {supportsGlow && <GlowTuner value={glow} onChange={setGlow} />}

            {embed && (
              <div className="break-all rounded-md bg-muted/50 px-2 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {embed}
              </div>
            )}

            <Button size="sm" onClick={handleInsert} disabled={!selected} className="mt-auto">
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
