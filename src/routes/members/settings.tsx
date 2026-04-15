import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { useAuth, API_URL, getAuthToken } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { getDisplayRank, highestRole } from "@/lib/ranks";

export const membersSettingsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "settings",
  component: SettingsPage,
});

// ── shared fetch helper ────────────────────────────────────────────────────

async function authedPatch(path: string, body: unknown): Promise<Response> {
  const token = getAuthToken();
  return fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

// ── sub-sections ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, refresh } = useAuth();
  const [rsn, setRsn] = useState(user?.rsn ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await authedPatch("/members/me/rsn", { rsn });
      if (res.ok) {
        await refresh();
        setSuccess(true);
      } else {
        const data = await res.json() as { detail?: string };
        setError(data.detail ?? "Failed to update RSN.");
      }
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Profile</h2>

      <div className="flex items-center gap-4">
        {user.avatar ? (
          <img
            src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=64`}
            alt=""
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted" />
        )}
        <div>
          <p className="text-lg font-semibold text-foreground">{user.username}</p>
          <p className="text-sm text-muted-foreground">Discord account</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">In-game rank</span>
          <span className="text-foreground">{user.clan_rank ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Community rank</span>
          <span className="text-foreground">{getDisplayRank(user.clan_rank) ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discord role</span>
          <span className="text-foreground">{highestRole(user.discord_roles) ?? "-"}</span>
        </div>
      </div>

      {/* RSN edit */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-sm font-medium text-foreground" htmlFor="rsn-input">
          Linked RSN
        </label>
        <div className="flex gap-2">
          <input
            id="rsn-input"
            type="text"
            value={rsn}
            onChange={(e) => { setRsn(e.target.value); setSuccess(false); setError(null); }}
            maxLength={12}
            placeholder="Your RuneScape name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={handleSave}
            disabled={saving || rsn.trim() === (user.rsn ?? "")}
            size="sm"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {success && <p className="text-xs text-green-500">RSN updated.</p>}
      </div>
    </div>
  );
}

function PrivacyToggle({
  label,
  description,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function PrivacySection() {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleToggle(field: string, value: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await authedPatch("/members/me/privacy", { [field]: value });
      if (res.ok) {
        await refresh();
      } else {
        setError("Failed to update privacy setting.");
      }
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
      <p className="text-sm text-muted-foreground">
        You can also manage this with the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-foreground">
          /privacy
        </code>{" "}
        command in Discord.
      </p>

      <PrivacyToggle
        label="Opt out of stats tracking"
        description="Your in-game activity won't be stored or shown on leaderboards."
        checked={user.stats_opt_out}
        onToggle={() => handleToggle("stats_opt_out", !user.stats_opt_out)}
        disabled={saving}
      />

      <PrivacyToggle
        label="Hide connection notifications"
        description="Don't announce when you connect or disconnect from in-game clan chat."
        checked={user.hide_presence_notifications}
        onToggle={() => handleToggle("hide_presence_notifications", !user.hide_presence_notifications)}
        disabled={saving}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function AccountSection() {
  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Account</h2>
      <p className="text-sm text-muted-foreground">
        Additional account settings coming soon.
      </p>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-rs-bold text-3xl text-primary">Settings</h1>
      <ProfileSection />
      <PrivacySection />
      <AccountSection />
    </div>
  );
}
