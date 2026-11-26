import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/members/Panel";
import { type LinkedAccount, getAccounts, addAccount, setPrimaryAccount, removeAccount } from "@/api/accounts";
import { INPUT_CLASS } from "./settingsApi";

const ACCOUNT_CAP = 5;

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function AccountsSection(): React.ReactElement | null {
  const { user, refresh } = useAuth();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRsn, setNewRsn] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  async function reload(): Promise<void> {
    setAccounts(await getAccounts());
  }

  useEffect(() => {
    if (!user) return;
    reload().finally(() => setLoading(false));
  }, [user]);

  async function act(run: () => Promise<unknown>, fallback: string): Promise<void> {
    setActionError(null);
    try {
      await run();
      await reload();
      await refresh();
    } catch (err) {
      setActionError(errorText(err, fallback));
    }
  }

  async function handleAdd(): Promise<void> {
    if (!newRsn.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await addAccount(newRsn.trim());
      setNewRsn("");
      await reload();
      await refresh();
    } catch (err) {
      setAddError(errorText(err, "Failed to add account."));
    } finally {
      setAdding(false);
    }
  }

  function handleRemove(id: number): void {
    if (pendingDeleteId !== id) { setPendingDeleteId(id); return; }
    setPendingDeleteId(null);
    void act(() => removeAccount(id), "Failed to remove account.");
  }

  if (!user) return null;
  const atCap = accounts.length >= ACCOUNT_CAP;

  return (
    <Panel title="Linked Accounts">
      <p className="mb-3 text-sm text-muted-foreground">Up to {ACCOUNT_CAP} RSNs. Your primary account is used by default.</p>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts linked yet.</p>}
      <ul className="divide-y divide-border">
        {accounts.map((acc) => {
          const locked = acc.is_primary && accounts.length > 1;
          return (
            <li key={acc.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">{acc.rsn}</span>
              {acc.is_primary && <span className="text-xs font-bold uppercase tracking-wide text-primary">primary</span>}
              {!acc.is_primary && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => act(() => setPrimaryAccount(acc.id), "Failed to set primary.")}>
                  Set primary
                </Button>
              )}
              <button
                type="button"
                title={locked ? "Set another primary first" : "Remove"}
                aria-label={locked ? "Set another primary first" : `Remove ${acc.rsn}`}
                disabled={locked}
                onClick={() => handleRemove(acc.id)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {pendingDeleteId === acc.id && <span className="text-xs text-destructive">Click again to confirm</span>}
            </li>
          );
        })}
      </ul>
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {atCap ? (
        <p className="mt-3 text-sm text-muted-foreground">Account limit reached ({ACCOUNT_CAP}/{ACCOUNT_CAP}).</p>
      ) : (
        <div className="mt-3 space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Add alt RSN</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRsn}
              onChange={(e) => { setNewRsn(e.target.value); setAddError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              maxLength={12}
              placeholder="Alt RSN"
              className={INPUT_CLASS}
            />
            <Button size="sm" onClick={handleAdd} disabled={adding || !newRsn.trim()}>{adding ? "Adding…" : "Add"}</Button>
          </div>
          {addError && <p className="text-sm text-destructive">{addError}</p>}
        </div>
      )}
    </Panel>
  );
}
