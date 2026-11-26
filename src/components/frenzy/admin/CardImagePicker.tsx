import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FrenzyFilterLine } from "../FrenzyFilterLine";
import { SEARCH_SETTLE_MS, useDebounce } from "@/hooks/useDebounce";
import { useNpcSearch, useSpriteSearch } from "@/hooks/useOsrsClans";
import type { FrenzyItem } from "@/types/frenzyTemplate";

type Kind = "npc" | "sprite" | "item";
const KINDS: { value: Kind; label: string }[] = [
  { value: "npc", label: "NPC" },
  { value: "sprite", label: "Sprite" },
  { value: "item", label: "Item" },
];

interface Choice {
  key: string;
  name: string;
  url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  items: FrenzyItem[];
  onPick: (url: string) => void;
}

function useChoices(kind: Kind, q: string, items: FrenzyItem[]): { choices: Choice[]; isLoading: boolean } {
  const npcs = useNpcSearch(kind === "npc" ? q : "");
  const sprites = useSpriteSearch(kind === "sprite" ? q : "");
  if (kind === "item") {
    return { choices: items.filter((i) => i.icon_url).map((i) => ({ key: i.name, name: i.name, url: i.icon_url! })), isLoading: false };
  }
  if (kind === "npc") {
    const rows = npcs.data?.items ?? [];
    return { choices: rows.map((r) => ({ key: String(r.id), name: r.name, url: r.image_url })), isLoading: npcs.isLoading };
  }
  const rows = sprites.data?.items ?? [];
  return {
    choices: rows.map((r) => ({ key: String(r.id), name: r.category ? `${r.name} (${r.category})` : r.name, url: r.image_url })),
    isLoading: sprites.isLoading,
  };
}

/** One result. An image that fails to load leaves a blank box, so the tile never vanishes. */
function ChoiceTile({ choice, onPick }: { choice: Choice; onPick: () => void }): React.ReactElement {
  const [broken, setBroken] = useState(false);
  return (
    <button type="button" onClick={onPick} disabled={broken} className="grid justify-items-center gap-1 rounded-md border p-2 text-xs hover:bg-muted disabled:opacity-50" title={choice.name}>
      {broken ? (
        <span role="img" aria-label={`${choice.name} has no image`} className="h-16 w-16 rounded-md bg-muted" />
      ) : (
        <img src={choice.url} alt={choice.name} className="h-16 w-16 object-contain" onError={() => setBroken(true)} />
      )}
      <span className="w-full truncate text-center">{choice.name}</span>
    </button>
  );
}

/** Picks a card image: an NPC still or a sprite from OSRSClans, or one of the card's own item images. */
export function CardImagePicker({ open, onOpenChange, cardName, items, onPick }: Props): React.ReactElement {
  const [kind, setKind] = useState<Kind>("npc");
  const [q, setQ] = useState(cardName);
  const term = useDebounce(q.trim(), SEARCH_SETTLE_MS);
  const { choices: shown, isLoading } = useChoices(kind, term, items);
  const searching = shown.length === 0 && (isLoading || (kind !== "item" && q.trim() !== term));

  useEffect(() => {
    if (open) setQ(cardName);
  }, [open, cardName]);

  function pick(url: string): void {
    onPick(url);
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Card image</DialogTitle>
        </DialogHeader>
        <FrenzyFilterLine label="From" options={KINDS} value={kind} onChange={setKind} />
        {kind !== "item" && <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="h-8 text-sm" />}
        <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
          {shown.map((c) => (
            <ChoiceTile key={c.key} choice={c} onPick={() => pick(c.url)} />
          ))}
        </div>
        {searching && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!searching && shown.length === 0 && <p className="text-sm text-muted-foreground">No images found.</p>}
        <Button variant="outline" onClick={() => pick("")}>No image: show the item images</Button>
      </DialogContent>
    </Dialog>
  );
}
