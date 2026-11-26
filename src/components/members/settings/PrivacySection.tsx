import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/members/Panel";
import { cn } from "@/lib/utils";
import { authedPatch } from "./settingsApi";

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}

function SettingSwitch({ label, description, checked, onToggle, disabled }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted ring-1 ring-border",
        )}
      >
        <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full shadow transition-transform motion-reduce:transition-none", checked ? "translate-x-5 bg-background" : "translate-x-0 bg-muted-foreground")} />
      </button>
    </div>
  );
}

export function PrivacySection(): React.ReactElement | null {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;

  async function handleToggle(field: string, value: boolean): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const res = await authedPatch("/members/me/privacy", { [field]: value });
      if (res.ok) await refresh();
      else setError("Failed to update privacy setting.");
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Privacy">
      <p className="text-sm text-muted-foreground">
        You can also manage this with the <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">/privacy</code> command in Discord.
      </p>
      <div className="divide-y divide-border">
        <SettingSwitch
          label="Opt out of stats tracking"
          description="Your in-game activity won't be stored or shown on leaderboards."
          checked={user.stats_opt_out}
          onToggle={() => handleToggle("stats_opt_out", !user.stats_opt_out)}
          disabled={saving}
        />
        <SettingSwitch
          label="Hide connection notifications"
          description="Don't announce when you connect or disconnect from in-game clan chat."
          checked={user.hide_presence_notifications}
          onToggle={() => handleToggle("hide_presence_notifications", !user.hide_presence_notifications)}
          disabled={saving}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Panel>
  );
}

export function AppearanceSection(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  return (
    <Panel title="Appearance">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Theme</p>
          <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme}>{theme === "dark" ? "Light mode" : "Dark mode"}</Button>
      </div>
    </Panel>
  );
}
