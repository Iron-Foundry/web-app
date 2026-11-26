import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/members/Panel";
import { getDisplayRank, highestRoleDisplay } from "@/lib/ranks";
import { authedPatch, INPUT_CLASS } from "./settingsApi";

function ReadRow({ label, value }: { label: string; value: string | null | undefined }): React.ReactElement {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? "-"}</span>
    </div>
  );
}

export function ProfileSection(): React.ReactElement | null {
  const { user, refresh } = useAuth();
  const [rsn, setRsn] = useState(user?.rsn ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  if (!user) return null;

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await authedPatch("/members/me/rsn", { rsn });
      if (res.ok) {
        await refresh();
        setSuccess(true);
      } else {
        const data = (await res.json()) as { detail?: string };
        setError(data.detail ?? "Failed to update RSN.");
      }
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Profile">
      <div className="mb-3 flex items-center gap-4">
        {user.avatar ? (
          <img src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=64`} alt={`${user.username} avatar`} className="h-14 w-14 rounded-full" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-muted" />
        )}
        <div>
          <p className="text-lg font-semibold">{user.username}</p>
          <p className="text-sm text-muted-foreground">Discord account</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        <ReadRow label="In-game rank" value={user.clan_rank} />
        <ReadRow label="Community rank" value={getDisplayRank(user.clan_rank)} />
        <ReadRow label="Discord role" value={highestRoleDisplay(user.effective_roles, user.role_labels)} />
      </div>
      <div className="mt-3 space-y-2 border-t border-border pt-4">
        <label className="text-sm font-medium" htmlFor="rsn-input">Linked RSN</label>
        <div className="flex gap-2">
          <input
            id="rsn-input"
            type="text"
            value={rsn}
            onChange={(e) => { setRsn(e.target.value); setSuccess(false); setError(null); }}
            maxLength={12}
            placeholder="Your RuneScape name"
            className={INPUT_CLASS}
          />
          <Button onClick={handleSave} disabled={saving || rsn.trim() === (user.rsn ?? "")} size="sm">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-mk-green">RSN updated.</p>}
      </div>
    </Panel>
  );
}
