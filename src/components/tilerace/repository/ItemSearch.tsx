import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { tileraceApi } from "@/api/tilerace";
import { itemIconUrl } from "@/components/runelite/bankTag";

interface OsrsSearchResult {
  id: number;
  name: string;
  icon_url: string;
}

interface ItemSearchProps {
  onSelect: (item: OsrsSearchResult) => void;
  placeholder?: string;
}

export function ItemSearch({ onSelect, placeholder = "Search OSRS items..." }: ItemSearchProps): JSX.Element {
  const [query, setQuery] = useState("");

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["tilerace", "osrs-item-search", query],
    queryFn: () => tileraceApi.searchItems(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
      {query.length >= 2 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-popover">
          {isFetching && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>
          )}
          {!isFetching && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No items found.</p>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery("");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
            >
              <img src={itemIconUrl(item.id)} alt={item.name} className="h-6 w-6 object-contain" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
