import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";

export const membersSettingsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "settings",
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-rs-bold text-3xl text-primary">Settings</h1>

      <div className="rounded-md border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
        <p className="text-sm text-muted-foreground">
          To opt out of stats tracking, use the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-foreground">
            /privacy
          </code>{" "}
          command in the Discord server.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Account</h2>
        <p className="text-sm text-muted-foreground">
          Additional account settings coming soon.
        </p>
      </div>
    </div>
  );
}
