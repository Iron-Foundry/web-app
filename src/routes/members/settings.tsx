import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { membersLayoutRoute } from "./_layout";
import { useAuth, API_URL, getAuthToken } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { getDisplayRank, highestRoleDisplay } from "@/lib/ranks";

export const membersSettingsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "settings",
  component: SettingsPage,
});



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
          <span className="text-foreground">{highestRoleDisplay(user.effective_roles, user.role_labels) ?? "-"}</span>
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

interface ApiKeyData {
  key: string | null;
  is_active: boolean;
  created_at: string | null;
}

function ApiKeySection() {
  const { user } = useAuth();
  const [keyData, setKeyData] = useState<ApiKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [justRotated, setJustRotated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    fetch(`${API_URL}/members/me/api-key`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setKeyData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleRotate() {
    if (
      keyData?.key &&
      !confirm("Generate a new API key? The current key will stop working immediately.")
    ) {
      return;
    }
    setRotating(true);
    setError(null);
    setJustRotated(false);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/members/me/api-key/rotate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as ApiKeyData;
        setKeyData(data);
        setJustRotated(true);
        setRevealed(true);
      } else {
        setError("Failed to rotate key.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setRotating(false);
    }
  }

  function handleCopy() {
    if (!keyData?.key) return;
    navigator.clipboard.writeText(keyData.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function maskKey(key: string) {
    if (key.length <= 12) return "•".repeat(key.length);
    return key.slice(0, 6) + "•".repeat(key.length - 12) + key.slice(-6);
  }

  if (!user) return null;

  const hasKey = !!keyData?.key;
  const createdAt = keyData?.created_at
    ? new Date(keyData.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">API Key</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Authenticate external tools (e.g. RuneLite plugins) with this key.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {hasKey && keyData?.key ? (
            <div className="space-y-2">
              {justRotated && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                  New key generated. Copy it now - rotate again to replace it.
                </div>
              )}
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono text-foreground truncate">
                  {revealed ? keyData.key : maskKey(keyData.key)}
                </code>
                <button
                  onClick={() => setRevealed((v) => !v)}
                  className="shrink-0 p-2 rounded-md border border-input hover:bg-muted text-muted-foreground hover:text-foreground"
                  title={revealed ? "Hide key" : "Show key"}
                >
                  {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-md border border-input hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 dark:text-green-400">Copied!</p>}
              {createdAt && (
                <p className="text-xs text-muted-foreground">Generated {createdAt}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API key yet.</p>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            size="sm"
            variant={hasKey ? "outline" : "default"}
            onClick={handleRotate}
            disabled={rotating}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {rotating ? "Generating…" : hasKey ? "Rotate key" : "Generate key"}
          </Button>
        </>
      )}
    </div>
  );
}

function AppearanceSection() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="rounded-md border border-border bg-card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>
    </div>
  );
}



function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-rs-bold text-3xl text-primary">Settings</h1>
      <ProfileSection />
      <ApiKeySection />
      <PrivacySection />
      <AppearanceSection />
    </div>
  );
}
