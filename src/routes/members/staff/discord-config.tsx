import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Tabs } from "radix-ui";
import { membersLayoutRoute } from "../_layout";
import { StaffGuard } from "@/components/StaffGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useRef } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, SmilePlus } from "lucide-react";
import { registerPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { discordApi } from "@/api/discord";
import { configApi } from "@/api/config";
import type { DiscordRole, DiscordChannelsResponse, GuildEmoji, RolePanel, SelectableRole } from "@/api/discord";
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
  guildEmojis: GuildEmoji[];
  discordRoles: DiscordRolesConfig;
  actionLog: ActionLogFeatureConfig;
  broadcast: BroadcastFeatureConfig;
  joinRoles: JoinRolesFeatureConfig;
  partyPanel: PartyPanelFeatureConfig;
  rolePanels: RolePanel[];
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

// ── Emoji Picker ──────────────────────────────────────────────────────────────

function emojiCdnUrl(emoji: GuildEmoji) {
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`;
}

function emojiString(emoji: GuildEmoji) {
  return emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
}

function EmojiPicker({
  value,
  guildEmojis,
  onChange,
}: {
  value: string | null;
  guildEmojis: GuildEmoji[];
  onChange: (val: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = guildEmojis.filter((e) =>
    search === "" || e.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectEmoji(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function clearEmoji() {
    onChange(null);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 h-8 px-2 rounded-md border text-sm transition-colors",
          "border-input bg-transparent hover:bg-muted",
          open && "border-ring ring-ring/50 ring-[3px]",
        )}
        title="Pick emoji"
      >
        {value ? (
          value.startsWith("<") ? (
            // Custom emoji - show image
            (() => {
              const match = value.match(/<a?:(\w+):(\d+)>/);
              const isAnimated = value.startsWith("<a:");
              return match ? (
                <img
                  src={`https://cdn.discordapp.com/emojis/${match[2]}.${isAnimated ? "gif" : "png"}`}
                  alt={match[1]}
                  className="h-4 w-4 object-contain"
                />
              ) : <span className="text-base leading-none">{value}</span>;
            })()
          ) : (
            <span className="text-base leading-none">{value}</span>
          )
        ) : (
          <SmilePlus className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-72 rounded-md border border-border bg-popover shadow-md">
          <div className="p-2 border-b border-border space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={value && !value.startsWith("<") ? value : ""}
                onChange={(e) => { onChange(e.target.value || null); }}
                placeholder="Type or paste emoji…"
                className="h-7 text-sm flex-1"
                autoFocus
              />
              {value && (
                <button
                  type="button"
                  onClick={clearEmoji}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            {guildEmojis.length > 0 && (
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search server emojis…"
                className="h-7 text-sm"
              />
            )}
          </div>

          {guildEmojis.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Server emojis</p>
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No matches.</p>
              ) : (
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  {filtered.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      title={e.name}
                      onClick={() => selectEmoji(emojiString(e))}
                      className={cn(
                        "flex items-center justify-center rounded p-0.5 hover:bg-muted transition-colors",
                        value === emojiString(e) && "bg-muted ring-1 ring-primary",
                      )}
                    >
                      <img src={emojiCdnUrl(e)} alt={e.name} className="h-6 w-6 object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Role Panels Tab ───────────────────────────────────────────────────────────

function RolePanelEditor({
  panel,
  roles,
  guildEmojis,
  onSaved,
  onDeleted,
}: {
  panel: RolePanel;
  roles: DiscordRole[];
  guildEmojis: GuildEmoji[];
  onSaved: (updated: RolePanel) => void;
  onDeleted: (panelId: string) => void;
}) {
  const [title, setTitle] = useState(panel.title);
  const [description, setDescription] = useState(panel.description);
  const [maxSelectable, setMaxSelectable] = useState<string>(
    panel.max_selectable != null ? String(panel.max_selectable) : ""
  );
  const [panelRoles, setPanelRoles] = useState<SelectableRole[]>(panel.roles);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function markDirty() { setDirty(true); setSaved(false); }

  function updateRole(idx: number, field: keyof SelectableRole, val: string | null) {
    setPanelRoles((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    markDirty();
  }

  function addRole() {
    setPanelRoles((prev) => [...prev, { role_id: "", label: "", description: "", emoji: null }]);
    markDirty();
  }

  function removeRole(idx: number) {
    setPanelRoles((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await discordApi.updateRolePanel(panel.panel_id, {
        title,
        description,
        max_selectable: maxSelectable !== "" ? parseInt(maxSelectable, 10) : null,
        roles: panelRoles,
      });
      setDirty(false);
      setSaved(true);
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete panel "${title}"? The Discord message will become orphaned.`)) return;
    setDeleting(true);
    try {
      await discordApi.deleteRolePanel(panel.panel_id);
      onDeleted(panel.panel_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed.");
      setDeleting(false);
    }
  }

  return (
    <div className="border border-border rounded-md">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="text-sm font-medium">{title || "(untitled)"}</span>
          <span className="text-xs text-muted-foreground font-mono">{panel.channel_id}</span>
        </div>
        <span className="text-xs text-muted-foreground">{panelRoles.length} role{panelRoles.length !== 1 ? "s" : ""}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border">
          <div className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-3 items-center max-w-lg pt-4">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} className="h-8 text-sm" />

            <label className="text-sm font-medium self-start pt-1">Description</label>
            <Textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} className="text-sm resize-y min-h-20" placeholder="Optional embed description" />

            <label className="text-sm font-medium">Max selectable</label>
            <Input
              type="number"
              min={1}
              max={25}
              value={maxSelectable}
              onChange={(e) => { setMaxSelectable(e.target.value); markDirty(); }}
              className="h-8 text-sm w-24"
              placeholder="No limit"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Roles</p>
            {panelRoles.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_1fr_5rem_2rem] gap-2 px-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discord Role</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emoji</p>
                <span />
              </div>
            )}
            <div className="space-y-2">
              {panelRoles.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_5rem_2rem] gap-2 items-center">
                  <RoleSelect
                    value={r.role_id}
                    roles={roles}
                    onChange={(v) => updateRole(i, "role_id", v)}
                    placeholder="Select role"
                  />
                  <Input value={r.label} onChange={(e) => updateRole(i, "label", e.target.value)} placeholder="Label" className="h-8 text-sm" />
                  <Input value={r.description} onChange={(e) => updateRole(i, "description", e.target.value)} placeholder="Short description" className="h-8 text-sm" />
                  <EmojiPicker value={r.emoji} guildEmojis={guildEmojis} onChange={(v) => updateRole(i, "emoji", v)} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeRole(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            {panelRoles.length === 0 && <p className="text-sm text-muted-foreground">No roles configured.</p>}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addRole} disabled={panelRoles.length >= 25}>
              <Plus className="h-3.5 w-3.5" />Add role
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            After saving, run <code className="bg-muted px-1 rounded">/rolepanel refresh {panel.panel_id}</code> in Discord to sync the embed.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && !dirty && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button variant="outline" size="default" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete panel"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RolePanelsTab({ initialPanels, roles, guildEmojis }: { initialPanels: RolePanel[]; roles: DiscordRole[]; guildEmojis: GuildEmoji[] }) {
  const [panels, setPanels] = useState<RolePanel[]>(initialPanels);

  function handleSaved(updated: RolePanel) {
    setPanels((prev) => prev.map((p) => p.panel_id === updated.panel_id ? updated : p));
  }

  function handleDeleted(panelId: string) {
    setPanels((prev) => prev.filter((p) => p.panel_id !== panelId));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Edit existing role panels. To create a new panel, use <code className="bg-muted px-1 rounded">/rolepanel create</code> in Discord.
      </p>
      {panels.length === 0 && (
        <p className="text-sm text-muted-foreground">No role panels found. Create one with <code className="bg-muted px-1 rounded">/rolepanel create</code>.</p>
      )}
      <div className="space-y-2">
        {panels.map((panel) => (
          <RolePanelEditor
            key={panel.panel_id}
            panel={panel}
            roles={roles}
            guildEmojis={guildEmojis}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
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
      discordApi.getEmojis(),
      configApi.getDiscordRoles(),
      configApi.getActionLogConfig(),
      configApi.getBroadcastConfig(),
      configApi.getJoinRolesConfig(),
      configApi.getPartyPanelConfig(),
      discordApi.listRolePanels(),
    ]).then(([rolesRes, channelsRes, emojisRes, discordRoles, actionLog, broadcast, joinRoles, partyPanel, rolePanelsRes]) => {
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
        guildEmojis: emojisRes.status === "fulfilled" ? emojisRes.value.emojis : [],
        discordRoles: unwrap(discordRoles, EMPTY_DISCORD_ROLES),
        actionLog: unwrap(actionLog, EMPTY_ACTION_LOG),
        broadcast: unwrap(broadcast, EMPTY_BROADCAST),
        joinRoles: unwrap(joinRoles, EMPTY_JOIN_ROLES),
        partyPanel: unwrap(partyPanel, EMPTY_PARTY_PANEL),
        rolePanels: rolePanelsRes.status === "fulfilled" ? rolePanelsRes.value.panels : [],
      });
    });
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!pageData) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl w-full space-y-6 py-6">
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
          <Tabs.Trigger value="role-panels" className={tabTrigger}>Role Panels</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="staff-roles">
          <StaffRolesTab data={pageData.discordRoles} roles={pageData.roles} />
        </Tabs.Content>
        <Tabs.Content value="feature-channels">
          <FeatureChannelsTab data={pageData} roles={pageData.roles} channels={pageData.channels} />
        </Tabs.Content>
        <Tabs.Content value="role-panels">
          <RolePanelsTab initialPanels={pageData.rolePanels} roles={pageData.roles} guildEmojis={pageData.guildEmojis} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
