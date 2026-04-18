import { useState } from "react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LinkRsnModal() {
  const { user, refresh } = useAuth();
  const [rsn, setRsn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show only when logged in with no RSN linked
  const open = !!user && !user.rsn;

  async function handleSubmit() {
    const trimmed = rsn.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/members/me/rsn`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rsn: trimmed }),
      });
      if (res.ok) {
        await refresh(); // user.rsn will be set → open becomes false
      } else {
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        setError(data.detail ?? "Failed to link RSN. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Link your RuneScape name</DialogTitle>
          <DialogDescription>
            Enter your in-game name to connect your Discord profile to your clan activity and stats.
            You can change this later in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <Input
            value={rsn}
            onChange={(e) => {
              setRsn(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && !saving && handleSubmit()}
            placeholder="Your RuneScape name"
            maxLength={12}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={saving || !rsn.trim()}>
            {saving ? "Linking…" : "Link RSN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
