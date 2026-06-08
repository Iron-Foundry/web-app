import { useEffect, useState } from "react";
import { Tabs } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, slugify } from "@/lib/utils";
import { contentApi } from "@/api/content";

interface EntryItem {
  id: string;
  title: string;
  slug: string;
}

interface Heading {
  text: string;
  id: string;
  level: number;
}

const TYPES = [
  { value: "resource", label: "Resource" },
  { value: "plugin", label: "Plugin" },
  { value: "staff_resource", label: "Staff Resource" },
] as const;

interface EntryRefPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (syntax: string) => void;
}

const tabTrigger = cn(
  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

const LEVEL_PREFIX: Record<number, string> = { 1: "#", 2: "##", 3: "###", 4: "####" };

function parseHeadings(body: string): Heading[] {
  const out: Heading[] = [];
  const re = /^(#{1,4})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const text = m[2]!.trim();
    out.push({ text, id: slugify(text), level: m[1]!.length });
  }
  return out;
}

export function EntryRefPickerDialog({ open, onClose, onSelect }: EntryRefPickerDialogProps) {
  const [activeType, setActiveType] = useState("resource");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EntryItem | null>(null);
  const [displayText, setDisplayText] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loadingHeadings, setLoadingHeadings] = useState(false);
  const [selectedHeading, setSelectedHeading] = useState<Heading | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setSearch("");
    setDisplayText("");
    setHeadings([]);
    setSelectedHeading(null);
    void loadEntries(activeType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setSearch("");
    setHeadings([]);
    setSelectedHeading(null);
    void loadEntries(activeType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  async function loadEntries(type: string) {
    setLoading(true);
    try {
      const tree = await contentApi.getCategories(type);
      const flat: EntryItem[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function collect(cats: any[]) {
        for (const cat of cats) {
          for (const e of cat.entries ?? []) {
            flat.push({ id: e.id as string, title: e.title as string, slug: e.slug as string });
          }
          collect(cat.children ?? []);
        }
      }
      collect(tree);
      setEntries(flat);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(entry: EntryItem) {
    setSelected(entry);
    setDisplayText(entry.title);
    setSelectedHeading(null);
    setHeadings([]);
    setLoadingHeadings(true);
    try {
      const detail = await contentApi.getEntryBySlug(activeType, entry.slug);
      setHeadings(parseHeadings(detail.body));
    } catch {
      // headings unavailable, user can still insert without a section
    } finally {
      setLoadingHeadings(false);
    }
  }

  const filtered = search.trim()
    ? entries.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    : entries;

  function handleInsert() {
    if (!selected) return;
    const sec = selectedHeading ? `#${selectedHeading.id}` : "";
    const display = displayText.trim() || selected.title;
    onSelect(`[[${activeType}:${selected.slug}${sec}|${display}]]`);
    onClose();
  }

  const preview = selected
    ? `[[${activeType}:${selected.slug}${selectedHeading ? `#${selectedHeading.id}` : ""}|${displayText || selected.title}]]`
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Insert Entry Reference</DialogTitle>
        </DialogHeader>

        <Tabs.Root value={activeType} onValueChange={setActiveType}>
          <Tabs.List className="flex gap-1 border border-border rounded-md bg-muted/40 p-1">
            {TYPES.map((t) => (
              <Tabs.Trigger key={t.value} value={t.value} className={tabTrigger}>
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <div className="flex gap-4 mt-1">
          {/* Entry list */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <Input
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="h-64 overflow-y-auto border border-border rounded-md">
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {entries.length === 0 ? "No entries found." : "No results."}
                </p>
              ) : (
                <div className="p-1 space-y-0.5">
                  {filtered.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => void handleSelect(entry)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md transition-colors",
                        selected?.id === entry.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      <span className="block text-sm">{entry.title}</span>
                      <span className="block text-[10px] text-muted-foreground font-mono">{entry.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Config panel */}
          <div className="w-52 shrink-0 flex flex-col gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Display text</label>
              <Input
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                className="h-8 text-sm"
                placeholder="Entry title"
                disabled={!selected}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Section (optional)</label>
              <div className="border border-border rounded-md overflow-y-auto" style={{ maxHeight: 152 }}>
                {!selected ? (
                  <p className="text-[11px] text-muted-foreground px-3 py-2">Select an entry first.</p>
                ) : loadingHeadings ? (
                  <p className="text-[11px] text-muted-foreground px-3 py-2">Loading...</p>
                ) : headings.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground px-3 py-2">No headings found.</p>
                ) : (
                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => setSelectedHeading(null)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-[11px] transition-colors",
                        !selectedHeading ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      - Entire entry
                    </button>
                    {headings.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedHeading(h)}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded text-[11px] transition-colors",
                          selectedHeading?.id === h.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground",
                        )}
                        style={{ paddingLeft: `${(h.level - 1) * 10 + 8}px` }}
                      >
                        <span className="font-mono text-[9px] text-muted-foreground mr-1">{LEVEL_PREFIX[h.level]}</span>
                        {h.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {preview && (
              <div className="rounded-md bg-muted/50 px-2 py-2 text-[10px] font-mono text-muted-foreground break-all leading-relaxed">
                {preview}
              </div>
            )}

            <Button
              size="sm"
              onClick={handleInsert}
              disabled={!selected}
              className="mt-auto"
            >
              Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
