import { Crown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SignupAccount {
  id: number;
  rsn: string;
  is_primary?: boolean;
}

interface Props {
  accounts: SignupAccount[];
  accountId: number | null;
  onAccountChange: (id: number) => void;
  captain: boolean;
  onCaptainChange: (captain: boolean) => void;
}

/** The account to compete with, and the captain opt-in. */
export function SignupFields({ accounts, accountId, onAccountChange, captain, onCaptainChange }: Props): React.ReactElement {
  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">Link an account first to sign up.</p>;
  }
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Account</Label>
        <Select value={accountId !== null ? String(accountId) : undefined} onValueChange={(v) => onAccountChange(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.rsn}
                {a.is_primary ? " (primary)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={captain} onCheckedChange={(v) => onCaptainChange(v === true)} />
        <Crown className="h-3.5 w-3.5 text-mk-yellow" />
        Willing to captain a team
      </label>
    </div>
  );
}
