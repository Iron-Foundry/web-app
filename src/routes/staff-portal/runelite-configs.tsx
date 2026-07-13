import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { registerPage } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { runeliteConfigsApi } from "@/api/runeliteConfigs";
import {
  RUNELITE_OBJECT_TYPES,
  getObjectType,
  objectTypeLabel,
  objectSummary,
} from "@/components/runelite/objectTypes";
import type { RuneLiteConfig } from "@/types/runeliteConfig";

registerPage({
  id: "staff.runelite_configs",
  label: "Staff - RuneLite Configs",
  description: "Store and edit RuneLite config objects used across the site.",
});


function ConfigName({ config }: { config: RuneLiteConfig }) {
  const Preview = getObjectType(config.type)?.preview;
  if (!Preview) {
    return <p className="truncate font-medium text-foreground">{config.name}</p>;
  }
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <p className="w-fit max-w-full cursor-default truncate font-medium text-foreground">
          {config.name}
        </p>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-2">
        <Preview config={config} />
      </HoverCardContent>
    </HoverCard>
  );
}

export function RuneliteConfigsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const canDelete = hasPermission("staff.runelite_configs", "delete", effectiveRoles);

  const [configs, setConfigs] = useState<RuneLiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState(RUNELITE_OBJECT_TYPES[0]?.value ?? "");
  const [editorType, setEditorType] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<RuneLiteConfig | null>(null);

  useEffect(() => {
    runeliteConfigsApi
      .list()
      .then(setConfigs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function closeEditor(): void {
    setEditorType(null);
    setEditTarget(null);
  }

  function handleSaved(config: RuneLiteConfig): void {
    setConfigs((prev) => {
      const idx = prev.findIndex((c) => c.id === config.id);
      return idx >= 0 ? prev.with(idx, config) : [...prev, config];
    });
    closeEditor();
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm("Delete this config object? Embeds using it will stop rendering.")) return;
    await runeliteConfigsApi.remove(id);
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  }

  function copyEmbed(config: RuneLiteConfig): void {
    const embed = getObjectType(config.type)?.embed(config.id);
    if (embed) void navigator.clipboard.writeText(embed);
  }

  const ActiveEditor = editorType ? getObjectType(editorType)?.editor : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-rs-bold text-2xl text-primary">RuneLite Configs</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Config objects that guides and pages pull from by stable ID.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Object type" />
            </SelectTrigger>
            <SelectContent>
              {RUNELITE_OBJECT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setEditorType(newType);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <Separator />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : configs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No config objects yet.</p>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center gap-4 rounded-lg border border-border p-3"
            >
              <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {objectTypeLabel(config.type)}
              </span>
              <div className="min-w-0 flex-1">
                <ConfigName config={config} />
                <p className="truncate text-xs text-muted-foreground">
                  {objectSummary(config)} - {config.description || "No description"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => copyEmbed(config)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Embed
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditTarget(config);
                    setEditorType(config.type);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ActiveEditor && (
        <ActiveEditor
          open={editorType !== null}
          initial={editTarget}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
