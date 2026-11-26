import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth, API_URL, getAuthToken } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel } from "@/components/members/Panel";
import { maskKey } from "./settingsApi";

interface ApiKeyData {
  key: string | null;
  is_active: boolean;
  created_at: string | null;
}

const KEY_BUTTON = "shrink-0 rounded-lg border border-input p-2 text-muted-foreground hover:bg-muted hover:text-foreground";

function RotateConfirm({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate a new API key?</DialogTitle>
          <DialogDescription>The current key will stop working immediately.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onOpenChange(false); onConfirm(); }}>Rotate key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeySection(): React.ReactElement | null {
  const { user } = useAuth();
  const [keyData, setKeyData] = useState<ApiKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [justRotated, setJustRotated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/members/me/api-key`, { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      .then((r) => (r.ok ? (r.json() as Promise<ApiKeyData>) : null))
      .then(setKeyData, () => setError("Your API key could not be loaded."))
      .finally(() => setLoading(false));
  }, [user]);

  async function rotate(): Promise<void> {
    setRotating(true);
    setError(null);
    setJustRotated(false);
    try {
      const res = await fetch(`${API_URL}/members/me/api-key/rotate`, { method: "POST", headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) { setError("Failed to rotate key."); return; }
      setKeyData((await res.json()) as ApiKeyData);
      setJustRotated(true);
      setRevealed(true);
    } catch {
      setError("Network error.");
    } finally {
      setRotating(false);
    }
  }

  function handleCopy(): void {
    if (!keyData?.key) return;
    navigator.clipboard.writeText(keyData.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!user) return null;
  const key = keyData?.key ?? null;
  const createdAt = keyData?.created_at
    ? new Date(keyData.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <Panel title="API Key">
      <p className="mb-3 text-sm text-muted-foreground">Authenticate external tools (e.g. RuneLite plugins) with this key.</p>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && !key && !error && <p className="text-sm text-muted-foreground">No API key yet.</p>}
      {key && (
        <div className="space-y-2">
          {justRotated && (
            <p className="rounded-lg border border-mk-yellow/35 bg-mk-yellow/10 px-3 py-2 text-sm">New key generated. Copy it now - rotate again to replace it.</p>
          )}
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-input bg-muted px-3 py-2 font-mono text-xs">{revealed ? key : maskKey(key)}</code>
            <button type="button" onClick={() => setRevealed((v) => !v)} className={KEY_BUTTON} title={revealed ? "Hide key" : "Show key"} aria-label={revealed ? "Hide key" : "Show key"}>
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button type="button" onClick={handleCopy} className={KEY_BUTTON} title="Copy to clipboard" aria-label="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && <p className="text-sm text-mk-green">Copied!</p>}
          {createdAt && <p className="text-sm text-muted-foreground">Generated {createdAt}</p>}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && (
        <Button className="mt-4" size="sm" variant={key ? "outline" : "default"} onClick={() => (key ? setConfirming(true) : rotate())} disabled={rotating}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {rotating ? "Generating…" : key ? "Rotate key" : "Generate key"}
        </Button>
      )}
      <RotateConfirm open={confirming} onOpenChange={setConfirming} onConfirm={() => void rotate()} />
    </Panel>
  );
}
