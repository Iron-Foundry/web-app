import { useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useFrenzySignupList } from "@/hooks/useFrenzyDraft";

interface Props {
  eventId: number;
  chosen: number[];
  disabled: boolean;
  onChange: (ids: number[]) => void;
}

/** The event's signups as a searchable checklist; ticked signups captain a team. */
export function CaptainPicker({ eventId, chosen, disabled, onChange }: Props): React.ReactElement {
  const { data, isLoading } = useFrenzySignupList(eventId);
  const [search, setSearch] = useState("");
  const signups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const items = data?.items ?? [];
    return needle ? items.filter((s) => s.rsn.toLowerCase().includes(needle)) : items;
  }, [data, search]);

  function toggle(id: number, on: boolean): void {
    onChange(on ? [...chosen, id] : chosen.filter((c) => c !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Captains <span className="text-muted-foreground">{chosen.length} chosen of {data?.total ?? 0} signups</span>
        </p>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search signups..." aria-label="Search signups" className="max-w-56" />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading signups...</p>}
      <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {signups.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-1.5 text-sm">
              <Checkbox checked={chosen.includes(s.id)} disabled={disabled} onCheckedChange={(v) => toggle(s.id, v === true)} />
              <span className="flex-1 truncate">{s.rsn}</span>
              {s.wants_captain && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Crown className="h-3.5 w-3.5 text-mk-yellow" aria-hidden />
                  Willing to captain
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
