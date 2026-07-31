import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tileraceApi } from "@/api/tilerace";
import { itemIconUrl } from "@/components/runelite/bankTag";

export interface OsrsIconResult {
  id: number;
  name: string;
  icon_url: string;
}

interface Props {
  kind: "item" | "npc";
  onKindChange: (kind: "item" | "npc") => void;
  onPick: (result: OsrsIconResult) => void;
}

const MIN_QUERY = 2;

export function OsrsIconSearch({ kind, onKindChange, onPick }: Props): JSX.Element {
  const [query, setQuery] = useState("");

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["tilerace", "icon-search", kind, query],
    queryFn: () =>
      kind === "item"
        ? tileraceApi.searchItems(query)
        : tileraceApi.searchNpcs(query),
    enabled: query.length >= MIN_QUERY,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["item", "npc"] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={kind === option ? "default" : "outline"}
            className="h-7 px-3 text-xs"
            onClick={() => onKindChange(option)}
          >
            {option === "item" ? "Item" : "NPC"}
          </Button>
        ))}
      </div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={kind === "item" ? "Search OSRS items..." : "Search OSRS NPCs..."}
        className="h-8 text-sm"
      />
      {query.length >= MIN_QUERY && (
        <div className="max-h-40 overflow-y-auto rounded-md border bg-popover">
          {isFetching && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>
          )}
          {!isFetching && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nothing found.</p>
          )}
          {results.map((result) => (
            <button
              key={`${kind}-${result.id}`}
              onClick={() => {
                onPick(result);
                setQuery("");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
            >
              <img
                src={kind === "item" ? itemIconUrl(result.id) : result.icon_url}
                alt={result.name}
                className="h-6 w-6 object-contain"
              />
              <span className="truncate">{result.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
