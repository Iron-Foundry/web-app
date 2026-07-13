import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown } from "lucide-react";

export interface SignupAccount {
  id: number;
  rsn: string;
  is_primary?: boolean;
}

interface SignupPanelProps {
  open: boolean;
  accounts: SignupAccount[];
  signedUp: boolean;
  currentAccountId: number | null;
  wantsCaptain: boolean;
  busy?: boolean;
  onSignUp: (accountId: number, wantsCaptain: boolean) => void;
  onChange: (accountId: number, wantsCaptain: boolean) => void;
  onRescind: () => void;
}

export function SignupPanel({
  open,
  accounts,
  signedUp,
  currentAccountId,
  wantsCaptain,
  busy = false,
  onSignUp,
  onChange,
  onRescind,
}: SignupPanelProps): JSX.Element | null {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [captain, setCaptain] = useState(false);

  if (!signedUp && !open) {
    return <p className="text-sm text-muted-foreground">Signups are closed.</p>;
  }

  function handleOpenChange(next: boolean): void {
    if (next) {
      const seed =
        currentAccountId ??
        accounts.find((a) => a.is_primary)?.id ??
        accounts[0]?.id ??
        null;
      setAccountId(seed);
      setCaptain(wantsCaptain);
    }
    setDialogOpen(next);
  }

  function submit(): void {
    if (accountId === null) return;
    if (signedUp) onChange(accountId, captain);
    else onSignUp(accountId, captain);
    setDialogOpen(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={signedUp ? "outline" : "default"}>
          {signedUp ? "Manage Signup" : "Sign Up"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{signedUp ? "Manage Signup" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            Choose which account to compete with. You can change it any time.
          </DialogDescription>
        </DialogHeader>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Link an account first to sign up.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Account</Label>
              <Select
                value={accountId !== null ? String(accountId) : undefined}
                onValueChange={(v) => setAccountId(Number(v))}
              >
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

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={captain}
                onCheckedChange={(v) => setCaptain(v === true)}
              />
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              Willing to captain a team
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {signedUp && (
            <Button
              variant="destructive"
              onClick={() => {
                onRescind();
                setDialogOpen(false);
              }}
              disabled={busy}
              className="mr-auto"
            >
              Rescind Signup
            </Button>
          )}
          <Button onClick={submit} disabled={busy || accountId === null}>
            {signedUp ? "Save Changes" : "Sign Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
