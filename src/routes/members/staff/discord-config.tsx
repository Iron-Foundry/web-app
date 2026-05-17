import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Tabs } from "radix-ui";
import { membersLayoutRoute } from "../_layout";
import { StaffGuard } from "@/components/StaffGuard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { discordApi } from "@/api/discord";
import { configApi } from "@/api/config";
import type { DiscordRole, DiscordChannelsResponse } from "@/api/discord";
import type {
  DiscordRolesConfig,
  ActionLogFeatureConfig,
  BroadcastFeatureConfig,
  JoinRolesFeatureConfig,
  PartyPanelFeatureConfig,
} from "@/api/config";

registerPage({
  id: "staff.discord-config",
  label: "Discord Config",
  description: "Configure staff role IDs and feature channel/role assignments.",
  defaults: { read: ["Foundry Mentors"], create: [], edit: ["Senior Moderator"], delete: [] },
});

export const staffDiscordConfigRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/discord-config",
  component: () => (
    <StaffGuard pageId="staff.discord-config">
      <DiscordConfigPage />
    </StaffGuard>
  ),
});

const tabTrigger = cn(
  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
  "text-muted-foreground border-transparent hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-primary",
);

// ── Shared state types ────────────────────────────────────────────────────────

interface PageData {
  roles: DiscordRole[];
  channels: DiscordChannelsResponse;
  discordRoles: DiscordRolesConfig;
  actionLog: ActionLogFeatureConfig;
  broadcast: BroadcastFeatureConfig;
  joinRoles: JoinRolesFeatureConfig;
  partyPanel: PartyPanelFeatureConfig;
}

// ── Helper components ─────────────────────────────────────────────────────────

function RoleSelect({
  value,
  roles,
  onChange,
  placeholder,
}: {
  value: string;
  roles: DiscordRole[];
  onChange: (id: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">None</span>
        </SelectItem>
        {roles.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            <span className="flex items-center gap-2">
              {r.color !== 0 && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `#${r.color.toString(16).padStart(6, "0")}` }}
                />
              )}
              {r.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ChannelSelect({
  value,
  channels,
  filterTypes,
  onChange,
  placeholder,
}: {
  value: string;
  channels: DiscordChannelsResponse;
  filterTypes?: number[];
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const channelIcon = (type: number) => {
    if (type === 2 || type === 13) return "🔊";
    if (type === 15) return "💬";
    if (type === 5) return "📢";
    return "#";
  };

  const filter = (ch: { type: number }) =>
    !filterTypes || filterTypes.includes(ch.type);

  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">None</span>
        </SelectItem>
        {channels.uncategorized.filter(filter).map((ch) => (
          <SelectItem key={ch.id} value={ch.id}>
            <span className="font-mono text-muted-foreground mr-1">{channelIcon(ch.type)}</span>
            {ch.name}
          </SelectItem>
        ))}
        {channels.categories.map((cat) => {
          const filtered = cat.channels.filter(filter);
          if (filtered.length === 0) return null;
          return (
            <SelectGroup key={cat.id}>
              <SelectLabel>{cat.name}</SelectLabel>
              {filtered.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  <span className="font-mono text-muted-foreground mr-1">{channelIcon(ch.type)}</span>
                  {ch.name}
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ── Staff Roles Tab ───────────────────────────────────────────────────────────

function StaffRolesTab({ data, roles }: { data: DiscordRolesConfig; roles: DiscordRole[] }) {
  const [cfg, setCfg] = useState<DiscordRolesConfig>(data);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(field: keyof DiscordRolesConfig, val: string) {
    setCfg((prev) => ({ ...prev, [field]: val }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await configApi.updateDiscordRoles(cfg);
      setDirty(false);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: keyof DiscordRolesConfig; label: string }[] = [
    { key: "staff_role_id", label: "Staff Role" },
    { key: "senior_staff_role_id", label: "Senior Staff Role" },
    { key: "owner_role_id", label: "Owner Role" },
    { key: "mentor_role_id", label: "Mentor Role" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Map staff permission tiers to Discord roles. Used by the bot for command access checks.
      </p>
      <div className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-3 items-center max-w-lg">
        {fields.map(({ key, label }) => (
          <>
            <label key={`label-${key}`} className="text-sm font-medium">{label}</label>
            <RoleSelect
              key={`select-${key}`}
              value={cfg[key]}
              roles={roles}
              onChange={(v) => update(key, v)}
              placeholder={`Select ${label.toLowerCase()}`}
            />
          </>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !dirty && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      <Button onClick={handleSave} disabled={saving || !dirty}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}

// ── Feature Channels Tab ──────────────────────────────────────────────────────

function ActionLogSection({
  data,
  channels,
}: {
  data: ActionLogFeatureConfig;
  channels: DiscordChannelsResponse;
}) {
  const [cfg, setCfg] = useState(data);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await configApi.updateActionLogConfig(cfg);
      setDirty(false);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Action Log</h3>
      <p className="text-sm text-muted-foreground">Forum channel where bot posts audit log threads.</p>
      <div className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-3 items-center max-w-lg">
        <label className="text-sm font-medium">Forum Channel</label>
        <ChannelSelect
          value={cfg.forum_channel_id}
          channels={channels}
          filterTypes={[15]}
          onChange={(v) => { setCfg((p) => ({ ...p, forum_channel_id: v })); setDirty(true); setSaved(false); }}
          placeholder="Select forum channel"
        />
        <label className="text-sm font-medium">Enabled</label>
        <input
          type="checkbox"
          checked={cfg.enabled}
          className="h-4 w-4"
          onChange={(e) => { setCfg((p) => ({ ...p, enabled: e.target.checked })); setDirty(true); setSaved(false); }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !dirty && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

function BroadcastSection({
  data,
  roles,
  channels,
}: {
  data: BroadcastFeatureConfig;
  roles: DiscordRole[];
  channels: DiscordChannelsResponse;
}) {
  const [cfg, setCfg] = useState(data);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  void channels;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await configApi.updateBroadcastConfig(cfg);
      setDirty(false);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Broadcast</h3>
      <p className="text-sm text-muted-foreground">Role pinged when a broadcast message is sent.</p>
      <div className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-3 items-center max-w-lg">
        <label className="text-sm font-medium">Broadcast Role</label>
        <RoleSelect
          value={cfg.role_id}
          roles={roles}
          onChange={(v) => { setCfg({ role_id: v }); setDirty(true); setSaved(false); }}
          placeholder="Select broadcast role"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !dirty && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

function JoinRolesSection({
  data,
  roles,
}: {
  data: JoinRolesFeatureConfig;
  roles: DiscordRole[];
}) {
  const [roleIds, setRoleIds] = useState<string[]>(data.role_ids);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await configApi.updateJoinRolesConfig({ role_ids: roleIds });
      setDirty(false);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Join Roles</h3>
      <p className="text-sm text-muted-foreground">Roles automatically assigned when a member joins the server.</p>
      <div className="space-y-2 max-w-lg">
        {roles.map((r) => (
          <label key={r.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={roleIds.includes(r.id)}
              onChange={() => toggle(r.id)}
            />
            <span className="flex items-center gap-2 text-sm">
              {r.color !== 0 && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: `#${r.color.toString(16).padStart(6, "0")}` }}
                />
              )}
              {r.name}
            </span>
          </label>
        ))}
        {roles.length === 0 && <p className="text-sm text-muted-foreground">No roles available.</p>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !dirty && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

function PartyPanelSection({ data }: { data: PartyPanelFeatureConfig }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Party Panel</h3>
      <p className="text-sm text-muted-foreground">
        Party panel channel and message IDs are managed by the bot. Configure the panel channel via
        Discord slash commands.
      </p>
      <div className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-2 max-w-lg">
        <span className="text-sm text-muted-foreground">Channel ID</span>
        <span className="text-sm font-mono">{data.channel_id || "-"}</span>
        <span className="text-sm text-muted-foreground">Message ID</span>
        <span className="text-sm font-mono">{data.message_id || "-"}</span>
      </div>
    </div>
  );
}

function FeatureChannelsTab({ data, roles, channels }: { data: PageData; roles: DiscordRole[]; channels: DiscordChannelsResponse }) {
  return (
    <div className="space-y-6">
      <ActionLogSection data={data.actionLog} channels={channels} />
      <Separator />
      <BroadcastSection data={data.broadcast} roles={roles} channels={channels} />
      <Separator />
      <JoinRolesSection data={data.joinRoles} roles={roles} />
      <Separator />
      <PartyPanelSection data={data.partyPanel} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY_CHANNELS: DiscordChannelsResponse = { categories: [], uncategorized: [] };
const EMPTY_DISCORD_ROLES: DiscordRolesConfig = { staff_role_id: "", senior_staff_role_id: "", owner_role_id: "", mentor_role_id: "" };
const EMPTY_ACTION_LOG: ActionLogFeatureConfig = { forum_channel_id: "", enabled: true };
const EMPTY_BROADCAST: BroadcastFeatureConfig = { role_id: "" };
const EMPTY_JOIN_ROLES: JoinRolesFeatureConfig = { role_ids: [] };
const EMPTY_PARTY_PANEL: PartyPanelFeatureConfig = { channel_id: "", message_id: "" };

function unwrap<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function DiscordConfigPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [discordUnavailable, setDiscordUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      discordApi.getRoles(),
      discordApi.getChannels(),
      configApi.getDiscordRoles(),
      configApi.getActionLogConfig(),
      configApi.getBroadcastConfig(),
      configApi.getJoinRolesConfig(),
      configApi.getPartyPanelConfig(),
    ]).then(([rolesRes, channelsRes, discordRoles, actionLog, broadcast, joinRoles, partyPanel]) => {
      // Config endpoints are required - fail hard if they reject
      if (discordRoles.status === "rejected" || actionLog.status === "rejected") {
        setError("Failed to load config. Check that the API is running and you have permission.");
        return;
      }
      // Discord API endpoints are optional - degrade gracefully if bot token not configured
      const rolesUnavailable = rolesRes.status === "rejected" || channelsRes.status === "rejected";
      setDiscordUnavailable(rolesUnavailable);
      setPageData({
        roles: rolesRes.status === "fulfilled" ? rolesRes.value.roles : [],
        channels: unwrap(channelsRes, EMPTY_CHANNELS),
        discordRoles: unwrap(discordRoles, EMPTY_DISCORD_ROLES),
        actionLog: unwrap(actionLog, EMPTY_ACTION_LOG),
        broadcast: unwrap(broadcast, EMPTY_BROADCAST),
        joinRoles: unwrap(joinRoles, EMPTY_JOIN_ROLES),
        partyPanel: unwrap(partyPanel, EMPTY_PARTY_PANEL),
      });
    });
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!pageData) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Discord Config</h1>
      </div>
      {discordUnavailable && (
        <p className="text-sm text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-md px-3 py-2 bg-amber-50 dark:bg-amber-950/30">
          Discord API unavailable - role and channel dropdowns are empty. Check that DISCORD_TOKEN and GUILD_ID are configured in the API.
        </p>
      )}

      <Tabs.Root defaultValue="staff-roles">
        <Tabs.List className="flex border-b border-border mb-6">
          <Tabs.Trigger value="staff-roles" className={tabTrigger}>Staff Roles</Tabs.Trigger>
          <Tabs.Trigger value="feature-channels" className={tabTrigger}>Feature Channels</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="staff-roles">
          <StaffRolesTab data={pageData.discordRoles} roles={pageData.roles} />
        </Tabs.Content>
        <Tabs.Content value="feature-channels">
          <FeatureChannelsTab data={pageData} roles={pageData.roles} channels={pageData.channels} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
