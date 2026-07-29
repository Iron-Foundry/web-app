import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrackSearch } from "@/hooks/useMusic";
import { duration, SOURCE_ACCENT } from "./format";
import { cn } from "@/lib/utils";
import type { SearchResult, SearchSource, TrackInput } from "@/types/music";

const SOURCES: { value: SearchSource; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "youtube", label: "YouTube" },
  { value: "youtubemusic", label: "YT Music" },
  { value: "soundcloud", label: "SoundCloud" },
];

export function toTrackInput(result: SearchResult): TrackInput {
  return {
    source: result.source,
    identifier: result.identifier,
    title: result.title,
    author: result.author,
    duration_ms: result.duration_ms,
    isrc: result.isrc,
    uri: result.uri,
    artwork: result.artwork,
  };
}

interface TrackSearchProps {
  /** What pressing the plus on a result does. */
  onAdd: (tracks: TrackInput[]) => void;
  /** Disables adding, with a reason to show instead of failing on press. */
  disabledReason?: string | null;
  pending?: boolean;
}

/**
 * Find something to add, wherever it is being added to.
 *
 * Shared by the queue and the playlist editor because both take the same shape.
 * Searching itself never needs a voice session - it is a lookup against
 * Lavalink, not playback - so a playlist can be built with nothing playing.
 */
export function TrackSearch({
  onAdd,
  disabledReason = null,
  pending = false,
}: TrackSearchProps): React.ReactElement {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SearchSource>("spotify");
  const { data: results, isFetching, error } = useTrackSearch(query, source);

  const submit = (): void => setQuery(draft.trim());
  const found = results ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-[12rem] flex-1"
          placeholder="Search, or paste a link"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
        />
        <Select
          value={source}
          onValueChange={(value) => setSource(value as SearchSource)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={submit} disabled={!draft.trim() || isFetching}>
          <Search className="h-4 w-4" />
          {isFetching ? "Searching" : "Search"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : "That search failed."}
        </p>
      )}
      {disabledReason && found.length > 0 && (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      )}

      {query && !isFetching && found.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">Nothing found for that.</p>
      )}

      {found.length > 0 && (
        <>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {found.map((result, index) => (
              <li
                key={`${result.source}-${result.identifier}-${index}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate">
                  {result.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {result.author}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[10px] uppercase",
                    SOURCE_ACCENT[result.source] ?? "text-muted-foreground",
                  )}
                >
                  {result.source}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {result.is_stream ? "live" : duration(result.duration_ms)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  disabled={disabledReason !== null || pending}
                  aria-label={`Add ${result.title}`}
                  onClick={() => onAdd([toTrackInput(result)])}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
          {found.length > 1 && (
            <Button
              size="sm"
              variant="secondary"
              disabled={disabledReason !== null || pending}
              onClick={() => onAdd(found.map(toTrackInput))}
            >
              <Plus className="h-3.5 w-3.5" />
              Add all {found.length}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
