import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { Tabs } from "radix-ui";
import { Upload, X } from "lucide-react";
import { membersLayoutRoute } from "../_layout";
import { StaffGuard } from "@/components/StaffGuard";
import { registerPage } from "@/lib/permissions";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { ticketConfigApi, type TicketTypeConfig, type PanelConfig, type ImageInfo } from "@/api/ticketConfig";
import { configApi, type TicketFeaturesConfig } from "@/api/config";
import { API_URL } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

registerPage({
  id: "staff.ticket-config",
  label: "Ticket Config",
  description: "Configure ticket types - display, behaviour, welcome messages and images.",
  defaults: { read: ["Foundry Mentors"], create: [], edit: ["Foundry Mentors"], delete: ["Senior Moderator"] },
});

export const configTicketConfigRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/ticket-config",
  component: () => (
    <StaffGuard pageId="staff.ticket-config" redirectTo="/members">
      <TicketConfigPage />
    </StaffGuard>
  ),
});

const TYPE_LABELS: Record<string, string> = {
  general:        "General",
  rankup:         "Rank Up",
  join_cc:        "Join CC",
  contact_mentor: "Mentor",
  sensitive:      "Sensitive",
};

const RANK_IMAGE_TYPES = ["rankup", "join_cc"];

const tabTrigger = cn(
  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
  "text-muted-foreground border-transparent hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-primary",
);

// ── Page ─────────────────────────────────────────────────────────────────────

function TicketConfigPage() {
  const [configs, setConfigs] = useState<Record<string, TicketTypeConfig>>({});
  const [panelConfig, setPanelConfig] = useState<PanelConfig | null>(null);
  const [features, setFeatures] = useState<TicketFeaturesConfig>({ rank_pull_set_primary: false });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const canEditFeatures = hasPermission("staff.ticket-config", "edit", effectiveRoles);

  useEffect(() => {
    Promise.all([ticketConfigApi.list(), ticketConfigApi.getPanel(), configApi.getTicketFeatures()])
      .then(([list, panel, feats]) => {
        const map: Record<string, TicketTypeConfig> = {};
        for (const c of list) map[c.type_id] = c;
        setConfigs(map);
        setPanelConfig(panel);
        setFeatures(feats);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load config."))
      .finally(() => setLoading(false));
  }, []);

  function onSaved(updated: TicketTypeConfig) {
    setConfigs((prev) => ({ ...prev, [updated.type_id]: updated }));
  }

  const typeIds = ["general", "rankup", "join_cc", "contact_mentor", "sensitive"];

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <h1 className="font-rs-bold text-4xl text-primary">Ticket Config</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <h1 className="font-rs-bold text-4xl text-primary">Ticket Config</h1>
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Ticket Config</h1>
        <p className="text-sm text-muted-foreground">
          Configure ticket types - display, behaviour, welcome messages and images.
        </p>
      </div>

      <Tabs.Root defaultValue="general">
        <Tabs.List className="flex border-b border-border mb-6 overflow-x-auto">
          {typeIds.map((id) => (
            <Tabs.Trigger key={id} value={id} className={tabTrigger}>
              {configs[id]?.emoji ?? ""} {TYPE_LABELS[id] ?? id}
            </Tabs.Trigger>
          ))}
          <Tabs.Trigger value="panel" className={tabTrigger}>
            🖼 Panel
          </Tabs.Trigger>
        </Tabs.List>
        {typeIds.map((id) =>
          configs[id] ? (
            <Tabs.Content key={id} value={id}>
              <TicketTypeCard
                config={configs[id]}
                onSaved={onSaved}
                showRankImages={RANK_IMAGE_TYPES.includes(id)}
              />
            </Tabs.Content>
          ) : null,
        )}
        <Tabs.Content value="panel">
          {panelConfig && (
            <PanelCard
              images={panelConfig.images}
              onImageChange={(images) => setPanelConfig({ images })}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>

      <TicketFeaturesCard
        features={features}
        canEdit={canEditFeatures}
        onSaved={setFeatures}
      />
    </div>
  );
}

// ── TicketTypeCard ────────────────────────────────────────────────────────────

interface CardProps {
  config: TicketTypeConfig;
  onSaved: (updated: TicketTypeConfig) => void;
  showRankImages: boolean;
}

function TicketTypeCard({ config, onSaved, showRankImages }: CardProps) {
  const [local, setLocal] = useState<TicketTypeConfig>(config);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWelcome, setPreviewWelcome] = useState(false);

  useEffect(() => {
    setLocal(config);
    setDirty(false);
    setSaved(false);
    setError(null);
  }, [config.type_id]);

  function update<K extends keyof TicketTypeConfig>(field: K, value: TicketTypeConfig[K]) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await ticketConfigApi.patch(local.type_id, {
        display_name: local.display_name,
        description: local.description,
        emoji: local.emoji,
        color_hex: local.color_hex,
        enabled: local.enabled,
        max_open_per_user: local.max_open_per_user,
        welcome_text: local.welcome_text,
      });
      setLocal(updated);
      setDirty(false);
      setSaved(true);
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function onImageUploaded(img: ImageInfo) {
    setLocal((prev) => ({
      ...prev,
      images: [...prev.images.filter((i) => i.name !== img.name), img],
    }));
    onSaved({ ...local, images: [...local.images.filter((i) => i.name !== img.name), img] });
  }

  function onImageDeleted(name: string) {
    const next = local.images.filter((i) => i.name !== name);
    setLocal((prev) => ({ ...prev, images: next }));
    onSaved({ ...local, images: next });
  }

  const row = "grid grid-cols-[9rem_1fr] items-center gap-x-4 gap-y-3";
  const label = "text-sm font-medium text-right text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Display */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Display</h2>
        <div className={row}>
          <span className={label}>Name</span>
          <Input value={local.display_name} onChange={(e) => update("display_name", e.target.value)} />

          <span className={label}>Description</span>
          <Textarea
            value={local.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />

          <span className={label}>Emoji</span>
          <Input
            value={local.emoji}
            onChange={(e) => update("emoji", e.target.value)}
            maxLength={8}
            className="w-24"
          />

          <span className={label}>Accent colour</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={local.color_hex}
              onChange={(e) => update("color_hex", e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
            />
            <Input
              value={local.color_hex}
              onChange={(e) => update("color_hex", e.target.value)}
              maxLength={7}
              className="w-28 font-mono text-sm"
            />
          </div>

          <span className={label}>Enabled</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={local.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">Show in panel</span>
          </label>
        </div>
      </section>

      <hr className="border-border" />

      {/* Behaviour */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Behaviour</h2>
        <div className={row}>
          <span className={label}>Max open</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={local.max_open_per_user}
              onChange={(e) => update("max_open_per_user", parseInt(e.target.value, 10) || 0)}
              className="w-24 text-sm"
            />
            <span className="text-xs text-muted-foreground">per user (0 = unlimited)</span>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Welcome message */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Welcome Message
          </h2>
          <button
            onClick={() => setPreviewWelcome((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {previewWelcome ? "Edit" : "Preview"}
          </button>
        </div>
        {previewWelcome ? (
          <div className="rounded-md border border-border bg-muted/20 p-4 min-h-24 prose prose-sm dark:prose-invert max-w-none">
            {local.welcome_text ? (
              <MarkdownRenderer body={local.welcome_text} />
            ) : (
              <p className="text-xs text-muted-foreground italic">No welcome text set.</p>
            )}
          </div>
        ) : (
          <Textarea
            value={local.welcome_text}
            onChange={(e) => update("welcome_text", e.target.value)}
            rows={6}
            className="font-mono text-sm resize-y"
            placeholder="Markdown supported. Leave blank for no welcome message."
          />
        )}
      </section>

      {/* Images */}
      <>
        <hr className="border-border" />
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Images</h2>
          <div className="space-y-3">
            <ImageSlot
              typeId={local.type_id}
              name="header"
              label="Header Image"
              existing={local.images.find((i) => i.name === "header") ?? null}
              onUploaded={onImageUploaded}
              onDeleted={onImageDeleted}
            />
            {showRankImages && [
              { name: "rank_reqs", label: "Rank Requirements" },
              { name: "rank_upgrades", label: "Rank Upgrades" },
            ].map(({ name, label: imgLabel }) => {
              const existing = local.images.find((i) => i.name === name);
              return (
                <ImageSlot
                  key={name}
                  typeId={local.type_id}
                  name={name}
                  label={imgLabel}
                  existing={existing ?? null}
                  onUploaded={onImageUploaded}
                  onDeleted={onImageDeleted}
                />
              );
            })}
          </div>
        </section>
      </>

      <hr className="border-border" />

      {/* Footer */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {saved && !dirty && (
          <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

// ── TicketFeaturesCard ────────────────────────────────────────────────────────

interface FeaturesCardProps {
  features: TicketFeaturesConfig;
  canEdit: boolean;
  onSaved: (updated: TicketFeaturesConfig) => void;
}

function TicketFeaturesCard({ features, canEdit, onSaved }: FeaturesCardProps) {
  const [local, setLocal] = useState<TicketFeaturesConfig>(features);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocal(features);
    setDirty(false);
    setSaved(false);
    setError(null);
  }, [features]);

  function toggle(field: keyof TicketFeaturesConfig, value: boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await configApi.updateTicketFeatures(local);
      setLocal(updated);
      setDirty(false);
      setSaved(true);
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-md border border-border p-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ticket Features
        </h2>
        <p className="text-xs text-muted-foreground">
          Toggles for bot behaviour on Join CC and Rank Up tickets.
        </p>
      </div>

      <div className="space-y-3">
        <label className={cn("flex items-start gap-3", !canEdit && "opacity-50")}>
          <input
            type="checkbox"
            checked={local.rank_pull_set_primary}
            disabled={!canEdit}
            onChange={(e) => toggle("rank_pull_set_primary", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Set primary account on rank pull</p>
            <p className="text-xs text-muted-foreground">
              When a staff member uses the Pull Rank Score button and enters an RSN,
              automatically set that RSN as the ticket creator's primary account -
              only if they have no primary account set yet and the RSN is not
              already held by another user. Creates the user and account link if needed.
            </p>
          </div>
        </label>
      </div>

      {canEdit && (
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          {saved && !dirty && (
            <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── PanelCard ─────────────────────────────────────────────────────────────────

interface PanelCardProps {
  images: ImageInfo[];
  onImageChange: (images: ImageInfo[]) => void;
}

function PanelCard({ images, onImageChange }: PanelCardProps) {
  function onImageUploaded(img: ImageInfo) {
    onImageChange([...images.filter((i) => i.name !== img.name), img]);
  }
  function onImageDeleted(name: string) {
    onImageChange(images.filter((i) => i.name !== name));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Images</h2>
        <div className="space-y-3">
          <ImageSlot
            typeId="panel"
            name="header"
            label="Header Image"
            existing={images.find((i) => i.name === "header") ?? null}
            onUploaded={onImageUploaded}
            onDeleted={onImageDeleted}
          />
        </div>
      </section>
    </div>
  );
}

// ── ImageSlot ─────────────────────────────────────────────────────────────────

interface SlotProps {
  typeId: string;
  name: string;
  label: string;
  existing: ImageInfo | null;
  onUploaded: (img: ImageInfo) => void;
  onDeleted: (name: string) => void;
}

function ImageSlot({ typeId, name, label, existing, onUploaded, onDeleted }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setSlotError(null);
    try {
      const img = await ticketConfigApi.uploadImage(typeId, name, file);
      onUploaded(img);
    } catch (err: unknown) {
      setSlotError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setSlotError(null);
    try {
      await ticketConfigApi.deleteImage(typeId, name);
      onDeleted(name);
    } catch (err: unknown) {
      setSlotError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-start gap-4 rounded-md border border-border bg-muted/20 p-3">
      {/* Thumbnail */}
      <div className="h-20 w-28 shrink-0 rounded border border-border bg-muted flex items-center justify-center overflow-hidden">
        {existing ? (
          <img
            src={`${API_URL}/assets/${existing.filename}`}
            alt={existing.filename}
            className="max-h-full max-w-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="text-xs text-muted-foreground/50">No image</span>
        )}
      </div>

      {/* Info + controls */}
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-medium">{label}</p>
        {existing && (
          <p className="text-xs text-muted-foreground truncate">{existing.filename}</p>
        )}
        {slotError && <p className="text-xs text-destructive">{slotError}</p>}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || deleting}
            className="h-7 text-xs gap-1.5"
          >
            <Upload className="h-3 w-3" />
            {uploading ? "Uploading..." : existing ? "Replace" : "Upload"}
          </Button>
          {existing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || uploading}
              className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
              {deleting ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
