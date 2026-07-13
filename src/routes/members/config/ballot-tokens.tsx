import { useEffect, useState } from "react";
import { registerPage } from "@/lib/permissions";
import {
  useBallotTokenConfig,
  useSaveBallotTokenConfig,
} from "@/hooks/useBallotTokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { BallotTokenConfig } from "@/types/ballotTokens";

registerPage({
  id: "staff.ballot-tokens",
  label: "Ballot Tokens",
  description: "Configure ballot token vote cost, placement awards, and cap.",
});

const PLACEMENTS = ["1st", "2nd", "3rd", "4th", "5th"];

function numberField(value: number, onChange: (n: number) => void): React.JSX.Element {
  return (
    <Input
      type="number"
      value={String(value)}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9"
    />
  );
}

export function BallotTokensConfigPage(): React.JSX.Element {
  const { data } = useBallotTokenConfig();
  const save = useSaveBallotTokenConfig();
  const [form, setForm] = useState<BallotTokenConfig | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const setPlacement = (index: number, value: number): void => {
    const next = [...form.placement_tokens];
    next[index] = value;
    setForm({ ...form, placement_tokens: next });
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Ballot Token Config</h2>
        <p className="text-sm text-muted-foreground">
          Global defaults for the Ballot Booth poll economy.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Vote Cost</Label>
          {numberField(form.vote_cost, (n) => setForm({ ...form, vote_cost: n }))}
        </div>
        <div>
          <Label>Max Hold</Label>
          {numberField(form.max_hold, (n) => setForm({ ...form, max_hold: n }))}
        </div>
        <div>
          <Label>Bonus Threshold %</Label>
          {numberField(form.bonus_threshold_pct, (n) =>
            setForm({ ...form, bonus_threshold_pct: n }),
          )}
        </div>
        <div>
          <Label>Bonus Tokens</Label>
          {numberField(form.bonus_tokens, (n) =>
            setForm({ ...form, bonus_tokens: n }),
          )}
        </div>
      </div>

      <div>
        <Label>Placement Awards</Label>
        <div className="mt-1 grid grid-cols-5 gap-2">
          {PLACEMENTS.map((place, i) => (
            <div key={place}>
              <span className="text-xs text-muted-foreground">{place}</span>
              {numberField(form.placement_tokens[i] ?? 0, (n) => setPlacement(i, n))}
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
        {save.isPending ? "Saving..." : "Save Config"}
      </Button>
    </div>
  );
}
