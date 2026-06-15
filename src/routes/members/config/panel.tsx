import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ChevronUp, ChevronDown, Plus, X, MessageSquarePlus } from "lucide-react";
import { membersLayoutRoute } from "../_layout";
import { StaffGuard } from "@/components/StaffGuard";
import { registerPage } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  configApi,
  type InfoPanelConfig,
  type PanelMessage,
  type PanelSection,
  type SectionType,
  type ChannelEntry,
  type LinkEntry,
} from "@/api/config";
import { discordApi, type DiscordChannelsResponse } from "@/api/discord";
import { cn } from "@/lib/utils";

registerPage({
  id: "staff.panel",
  label: "Info Panel",
  description: "Configure the Cuddly Tower info panel sections, order, and message layout.",
  defaults: { read: ["Foundry Mentors"], create: [], edit: ["Foundry Mentors"], delete: [] },
});

export const configPanelRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/panel",
  component: () => (
    <StaffGuard pageId="staff.panel" redirectTo="/members">
      <PanelConfigPage />
    </StaffGuard>
  ),
});

const SECTION_LABELS: Record<SectionType, string> = {
  header_image:   "Header Image",
  server_stats:   "Clan Statistics",
  free_text:      "Free Text",
  channel_toc:    "Channel Overview",
  name_changes:   "Recent Name Changes",
  achievements:   "Recent Achievements",
  website_links:  "Website Links",
  personal_bests: "Personal Bests (Rank 1)",
  competitions:   "Competitions",
};

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  header_image:   "Banner image at the top of a message",
  server_stats:   "Member counts, XP, and boss KC",
  free_text:      "Custom markdown text block",
  channel_toc:    "Curated list of server channels",
  name_changes:   "Recent OSRS name changes in the clan",
  achievements:   "Recent drops, levels, and XP milestones",
  website_links:  "Buttons linking to web pages",
  personal_bests: "Rank 1 personal best times",
  competitions:   "Active and upcoming WOM competitions",
};

const ALL_SECTION_TYPES: SectionType[] = [
  "server_stats",
  "competitions",
  "achievements",
  "personal_bests",
  "name_changes",
  "channel_toc",
  "website_links",
  "free_text",
  "header_image",
];

function makeDefaultSection(type: SectionType): PanelSection {
  switch (type) {
    case "header_image":   return { type, image_url: "" };
    case "server_stats":   return { type };
    case "free_text":      return { type, content: "" };
    case "channel_toc":    return { type, channels: [] };
    case "name_changes":   return { type, count: 5 };
    case "achievements":   return { type, count: 5 };
    case "website_links":  return { type, links: [] };
    case "personal_bests": return { type, count: 5 };
    case "competitions":   return { type };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PanelConfigPage() {
  const [config, setConfig] = useState<InfoPanelConfig | null>(null);
  const [channels, setChannels] = useState<DiscordChannelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pickerForMessage, setPickerForMessage] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([configApi.getPanelConfig(), discordApi.getChannels()])
      .then(([cfg, chs]) => {
        setConfig(cfg);
        setChannels(chs);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load config."))
      .finally(() => setLoading(false));
  }, []);

  function mutate(fn: (cfg: InfoPanelConfig) => InfoPanelConfig) {
    setConfig((prev) => (prev ? fn(prev) : prev));
    setSaved(false);
  }

  function updateMessage(msgIdx: number, updated: PanelMessage) {
    mutate((cfg) => {
      const messages = [...cfg.messages];
      messages[msgIdx] = updated;
      return { ...cfg, messages };
    });
  }

  function addMessage() {
    mutate((cfg) => ({ ...cfg, messages: [...cfg.messages, { sections: [] }] }));
  }

  function removeMessage(msgIdx: number) {
    mutate((cfg) => ({ ...cfg, messages: cfg.messages.filter((_, i) => i !== msgIdx) }));
  }

  function addSectionToMessage(msgIdx: number, type: SectionType) {
    mutate((cfg) => {
      const messages = [...cfg.messages];
      const msg = messages[msgIdx];
      if (!msg) return cfg;
      messages[msgIdx] = { ...msg, sections: [...msg.sections, makeDefaultSection(type)] };
      return { ...cfg, messages };
    });
    setPickerForMessage(null);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await configApi.updatePanelConfig(config);
      setConfig(updated);
      setSaved(true);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <h1 className="font-rs-bold text-4xl text-primary">Info Panel</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <h1 className="font-rs-bold text-4xl text-primary">Info Panel</h1>
        <p className="text-sm text-destructive">{loadError ?? "No config loaded."}</p>
      </div>
    );
  }

  const allChannels = channels
    ? [...channels.uncategorized, ...channels.categories.flatMap((c) => c.channels)]
    : [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Info Panel</h1>
        <p className="text-sm text-muted-foreground">
          Build each Discord message visually. Add sections via the picker - duplicates are allowed.
        </p>
      </div>

      {/* Global settings */}
      <section className="rounded-md border border-border p-4 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Global Settings</h2>
        <div className="grid grid-cols-[10rem_1fr] items-center gap-x-4 gap-y-3">
          <span className="text-sm font-medium text-right text-muted-foreground">Refresh interval</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={config.refresh_interval_minutes}
              onChange={(e) => {
                mutate((cfg) => ({ ...cfg, refresh_interval_minutes: parseInt(e.target.value, 10) || 0 }));
              }}
              className="w-24 text-sm"
            />
            <span className="text-xs text-muted-foreground">minutes (0 = manual only)</span>
          </div>
        </div>
      </section>

      {/* Messages */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Messages</h2>

        {config.messages.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No messages configured. Add one below.</p>
        )}

        {config.messages.map((msg, msgIdx) => (
          <MessageCard
            key={msgIdx}
            message={msg}
            messageIndex={msgIdx}
            total={config.messages.length}
            allChannels={allChannels}
            onUpdate={(updated) => updateMessage(msgIdx, updated)}
            onRemove={() => removeMessage(msgIdx)}
            onAddSection={() => setPickerForMessage(msgIdx)}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={addMessage}
          className="gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Add Message
        </Button>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3 pb-8">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save Config"}
        </Button>
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      </div>

      {/* Section picker dialog */}
      <Dialog open={pickerForMessage !== null} onOpenChange={(open) => { if (!open) setPickerForMessage(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Section to Message {pickerForMessage !== null ? pickerForMessage + 1 : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {ALL_SECTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => pickerForMessage !== null && addSectionToMessage(pickerForMessage, type)}
                className="flex flex-col items-start gap-1 rounded-md border border-border bg-card p-3 text-left hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{SECTION_LABELS[type]}</span>
                <span className="text-xs text-muted-foreground">{SECTION_DESCRIPTIONS[type]}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── MessageCard ───────────────────────────────────────────────────────────────

interface MessageCardProps {
  message: PanelMessage;
  messageIndex: number;
  total: number;
  allChannels: { id: string; name: string }[];
  onUpdate: (updated: PanelMessage) => void;
  onRemove: () => void;
  onAddSection: () => void;
}

function MessageCard({ message, messageIndex, allChannels, onUpdate, onRemove, onAddSection }: MessageCardProps) {
  function updateSection(sectionIdx: number, updated: PanelSection) {
    const sections = [...message.sections];
    sections[sectionIdx] = updated;
    onUpdate({ ...message, sections });
  }

  function removeSection(sectionIdx: number) {
    onUpdate({ ...message, sections: message.sections.filter((_, i) => i !== sectionIdx) });
  }

  function moveSection(sectionIdx: number, dir: -1 | 1) {
    const target = sectionIdx + dir;
    if (target < 0 || target >= message.sections.length) return;
    const sections = [...message.sections];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [sections[sectionIdx], sections[target]] = [sections[target]!, sections[sectionIdx]!];
    onUpdate({ ...message, sections });
  }

  return (
    <div className="rounded-md border border-border bg-card">
      {/* Message header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold">Message {messageIndex + 1}</span>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Remove message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sections */}
      <div className="p-3 space-y-2">
        {message.sections.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-1">No sections yet. Add one below.</p>
        )}
        {message.sections.map((section, sIdx) => (
          <SectionRow
            key={`${section.type}-${sIdx}`}
            section={section}
            index={sIdx}
            total={message.sections.length}
            allChannels={allChannels}
            onUpdate={(updated) => updateSection(sIdx, updated)}
            onRemove={() => removeSection(sIdx)}
            onMove={(dir) => moveSection(sIdx, dir)}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={onAddSection}
          className="h-7 text-xs gap-1.5 mt-1"
        >
          <Plus className="h-3 w-3" />
          Add Section
        </Button>
      </div>
    </div>
  );
}

// ── SectionRow ────────────────────────────────────────────────────────────────

interface SectionRowProps {
  section: PanelSection;
  index: number;
  total: number;
  allChannels: { id: string; name: string }[];
  onUpdate: (updated: PanelSection) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

function SectionRow({ section, index, total, allChannels, onUpdate, onRemove, onMove }: SectionRowProps) {
  const label = SECTION_LABELS[section.type];

  return (
    <div className="rounded border border-border bg-background">
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <span className="text-sm font-medium flex-1">{label}</span>

        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Section settings */}
      <div className={cn("border-t border-border px-3 py-2.5")}>
        <SectionSettings section={section} allChannels={allChannels} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ── SectionSettings ───────────────────────────────────────────────────────────

interface SettingsProps {
  section: PanelSection;
  allChannels: { id: string; name: string }[];
  onUpdate: (updated: PanelSection) => void;
}

function SectionSettings({ section, allChannels, onUpdate }: SettingsProps) {
  if (section.type === "server_stats" || section.type === "competitions") {
    return <p className="text-xs text-muted-foreground italic">Auto - no config needed.</p>;
  }

  if (section.type === "header_image") {
    return (
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground w-20 text-right shrink-0">Image URL</label>
        <Input
          value={section.image_url}
          onChange={(e) => onUpdate({ ...section, image_url: e.target.value })}
          placeholder="https://..."
          className="text-sm"
        />
      </div>
    );
  }

  if (section.type === "free_text") {
    return (
      <Textarea
        value={section.content}
        onChange={(e) => onUpdate({ ...section, content: e.target.value })}
        rows={4}
        className="font-mono text-sm resize-y"
        placeholder="Supports Discord markdown..."
      />
    );
  }

  if (section.type === "name_changes" || section.type === "achievements" || section.type === "personal_bests") {
    const max = section.type === "achievements" ? 50 : 20;
    return (
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground w-20 text-right shrink-0">Count</label>
        <Input
          type="number"
          min={1}
          max={max}
          value={section.count}
          onChange={(e) => onUpdate({ ...section, count: Math.min(max, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
          className="w-20 text-sm"
        />
        <span className="text-xs text-muted-foreground">entries to show (max {max})</span>
      </div>
    );
  }

  if (section.type === "channel_toc") {
    return <ChannelTocSettings section={section} allChannels={allChannels} onUpdate={onUpdate} />;
  }

  if (section.type === "website_links") {
    return <WebsiteLinksSettings section={section} onUpdate={onUpdate} />;
  }

  return null;
}

// ── ChannelTocSettings ────────────────────────────────────────────────────────

interface ChannelTocProps {
  section: { type: "channel_toc"; channels: ChannelEntry[] };
  allChannels: { id: string; name: string }[];
  onUpdate: (updated: PanelSection) => void;
}

function ChannelTocSettings({ section, allChannels, onUpdate }: ChannelTocProps) {
  const configuredIds = new Set(section.channels.map((c) => c.channel_id));

  function addChannel(channelId: string) {
    if (configuredIds.has(channelId)) return;
    onUpdate({
      ...section,
      channels: [...section.channels, { channel_id: channelId, description: "", emoji: "" }],
    });
  }

  function removeChannel(index: number) {
    onUpdate({ ...section, channels: section.channels.filter((_, i) => i !== index) });
  }

  function updateChannel(index: number, patch: Partial<ChannelEntry>) {
    const channels = section.channels.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onUpdate({ ...section, channels });
  }

  const unconfigured = allChannels.filter((c) => !configuredIds.has(c.id));

  return (
    <div className="space-y-3">
      {section.channels.length > 0 && (
        <div className="space-y-2">
          {section.channels.map((entry, i) => {
            const ch = allChannels.find((c) => c.id === entry.channel_id);
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0 w-36 truncate">
                  #{ch?.name ?? entry.channel_id}
                </span>
                <Input
                  value={entry.description}
                  onChange={(e) => updateChannel(i, { description: e.target.value })}
                  placeholder="Description (optional)"
                  className="text-sm flex-1"
                />
                <button onClick={() => removeChannel(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {unconfigured.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => { if (e.target.value) { addChannel(e.target.value); e.target.value = ""; } }}
          className="text-sm rounded border border-input bg-background px-2 py-1.5 w-full"
        >
          <option value="" disabled>Add channel...</option>
          {unconfigured.map((c) => (
            <option key={c.id} value={c.id}>#{c.name}</option>
          ))}
        </select>
      )}

      {section.channels.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No channels added yet.</p>
      )}
    </div>
  );
}

// ── WebsiteLinksSettings ──────────────────────────────────────────────────────

interface WebsiteLinksProps {
  section: { type: "website_links"; links: LinkEntry[] };
  onUpdate: (updated: PanelSection) => void;
}

function WebsiteLinksSettings({ section, onUpdate }: WebsiteLinksProps) {
  function addLink() {
    onUpdate({ ...section, links: [...section.links, { label: "", url: "" }] });
  }

  function removeLink(index: number) {
    onUpdate({ ...section, links: section.links.filter((_, i) => i !== index) });
  }

  function updateLink(index: number, patch: Partial<LinkEntry>) {
    const links = section.links.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onUpdate({ ...section, links });
  }

  return (
    <div className="space-y-2">
      {section.links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={link.label}
            onChange={(e) => updateLink(i, { label: e.target.value })}
            placeholder="Label"
            className="text-sm w-36"
          />
          <Input
            value={link.url}
            onChange={(e) => updateLink(i, { url: e.target.value })}
            placeholder="https://..."
            className="text-sm flex-1"
          />
          <button onClick={() => removeLink(i)} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {section.links.length < 5 && (
        <Button size="sm" variant="outline" onClick={addLink} className="h-7 text-xs gap-1.5">
          <Plus className="h-3 w-3" /> Add Link
        </Button>
      )}
      {section.links.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No links added yet.</p>
      )}
    </div>
  );
}
