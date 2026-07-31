import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { useAddRosterMember, useTileraceCandidates } from "@/hooks/useTilerace";

interface Props {
  eventId: string;
}

export function AddRosterMember({ eventId }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: candidates = [], isFetching } = useTileraceCandidates(
    eventId,
    open ? search : "",
  );
  const { mutate: add, isPending } = useAddRosterMember();

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add member
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search RSN or Discord name"
        className="h-8 text-sm"
      />
      <div className="max-h-56 overflow-y-auto space-y-1">
        {isFetching && candidates.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">Searching...</p>
        )}
        {!isFetching && candidates.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">No matches.</p>
        )}
        {candidates.map((c) => (
          <button
            key={c.discord_user_id}
            type="button"
            disabled={isPending}
            onClick={() =>
              add(
                {
                  eventId,
                  data: { discord_user_id: c.discord_user_id, team_id: null },
                },
                { onSuccess: () => setSearch("") },
              )
            }
            className="w-full text-left px-2 py-1 rounded hover:bg-accent text-xs disabled:opacity-50"
          >
            <span className="font-medium">{c.rsn ?? "(no RSN)"}</span>
            {c.discord_username && (
              <span className="text-muted-foreground"> - {c.discord_username}</span>
            )}
          </button>
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => {
          setOpen(false);
          setSearch("");
        }}
      >
        Done
      </Button>
    </div>
  );
}
