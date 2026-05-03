import { useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { highestRoleDisplay } from "@/lib/ranks";
import { registerPage } from "@/lib/permissions";
import { usePermissions } from "@/context/PermissionsContext";

registerPage({
  id: "staff.surveys",
  label: "Staff - Surveys",
  description: "Manage survey and application templates, view responses.",
  defaults: { read: ["Foundry Mentors"], create: ["Senior Moderator"], edit: ["Senior Moderator"], delete: ["Senior Moderator"] },
});
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react";
import { TemplateEditorDialog, type TemplateEntry } from "./survey-editor";

export const staffSurveysRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/surveys",
  component: StaffSurveysPage,
});

interface Field {
  id: string;
  label: string;
  type: string;
  description?: string;
  required: boolean;
}

interface ResponseEntry {
  id: string;
  source: "web" | "discord";
  discord_user_id: number;
  discord_username: string | null;
  rsn: string | null;
  discord_roles: string[];
  answers: Record<string, unknown>;
  submitted_at: string | null;
}

type CategoryFilter = "all" | "survey" | "application";

// VISIBILITY_OPTIONS is derived dynamically in StaffSurveysPage from pagePermissions


function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAnswer(val: unknown): string {
  if (val === undefined || val === null || val === "") return "-";
  if (Array.isArray(val)) return (val as string[]).join(", ");
  return String(val);
}

function ResponseCard({ resp, fields }: { resp: ResponseEntry; fields: Field[] }) {
  const [open, setOpen] = useState(false);
  const rank = highestRoleDisplay(resp.discord_roles ?? [], {});
  const displayName = resp.rsn ?? resp.discord_username ?? String(resp.discord_user_id);

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{displayName}</span>
          {rank && (
            <Badge variant="outline" className="text-xs">
              {rank}
            </Badge>
          )}
          <Badge
            variant={resp.source === "web" ? "default" : "secondary"}
            className="text-xs"
          >
            {resp.source === "web" ? "Web" : "Discord"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{fmtDate(resp.submitted_at)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {open ? "Hide" : "Answers"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          {fields.length > 0
            ? fields.map((field) => (
                <div key={field.id} className="grid grid-cols-[2fr_3fr] gap-3 text-sm">
                  <span className="text-muted-foreground">{field.label}</span>
                  <span>{formatAnswer(resp.answers[field.id])}</span>
                </div>
              ))
            : Object.entries(resp.answers).map(([key, val]) => (
                <div key={key} className="grid grid-cols-[2fr_3fr] gap-3 text-sm">
                  <span className="text-muted-foreground font-mono text-xs">{key}</span>
                  <span>{formatAnswer(val)}</span>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  entry,
  isSeniorStaff,
  visibilityOptions,
  onVisibilityChange,
  onOpenChange,
  onEdit,
}: {
  entry: TemplateEntry;
  isSeniorStaff: boolean;
  visibilityOptions: { value: string; label: string }[];
  onVisibilityChange: (templateId: string, visibility: string[] | null) => void;
  onOpenChange: (templateId: string, isOpen: boolean) => void;
  onEdit: (templateId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<Field[] | null>(null);
  const [responses, setResponses] = useState<ResponseEntry[] | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [rankFilter, setRankFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);

  useEffect(() => {
    if (!expanded || responses !== null) return;
    setLoadingResponses(true);
    Promise.all([
      fetch(`${API_URL}/surveys/${entry.template_id}/responses`, {
        headers: getAuthHeaders(),
      }).then((r) => (r.ok ? (r.json() as Promise<ResponseEntry[]>) : Promise.resolve([]))),
      fetch(`${API_URL}/surveys/${entry.template_id}`, {
        headers: getAuthHeaders(),
      }).then((r) =>
        r.ok
          ? (r.json() as Promise<{ fields: Field[] }>)
          : Promise.resolve({ fields: [] })
      ),
    ])
      .then(([reps, detail]) => {
        setResponses(reps);
        setFields(detail.fields);
      })
      .catch(() => {
        setResponses([]);
        setFields([]);
      })
      .finally(() => setLoadingResponses(false));
  }, [expanded, entry.template_id, responses]);

  async function handleVisibilityChange(next: string[]) {
    setSaving(true);
    const body = { visibility: next.length === 0 ? null : next };
    await fetch(`${API_URL}/surveys/${entry.template_id}/visibility`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onVisibilityChange(entry.template_id, body.visibility);
  }

  async function handleOpenToggle() {
    setTogglingOpen(true);
    const next = !entry.is_open;
    await fetch(`${API_URL}/surveys/${entry.template_id}/open`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ is_open: next }),
    });
    setTogglingOpen(false);
    onOpenChange(entry.template_id, next);
  }

  const presentRanks = responses
    ? Array.from(new Set(responses.map((r) => r.discord_roles?.[0] ?? "unknown").filter(Boolean)))
    : [];

  const filteredResponses =
    responses === null
      ? []
      : rankFilter === "all"
        ? responses
        : responses.filter((r) => (r.discord_roles?.[0] ?? "unknown") === rankFilter);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="font-rs-bold text-lg text-primary leading-tight">{entry.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {isSeniorStaff && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onEdit(entry.template_id)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {entry.category}
            </Badge>
            {entry.is_open ? (
              <Badge variant="default" className="text-xs">
                Open
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Closed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {entry.description && (
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          {isSeniorStaff && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleOpenToggle}
              disabled={togglingOpen}
            >
              {entry.is_open ? "Close survey" : "Open survey"}
            </Button>
          )}

          {isSeniorStaff ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground shrink-0">Responses visible to:</span>
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={entry.visibility ?? []}
                onValueChange={handleVisibilityChange}
                disabled={saving}
                className="flex-wrap"
              >
                {visibilityOptions.map((o) => (
                  <ToggleGroupItem key={o.value} value={o.value} className="h-6 px-2 text-xs">
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {(!entry.visibility || entry.visibility.length === 0) && (
                <span className="text-xs text-muted-foreground">(Staff only)</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Responses visible to:{" "}
              {!entry.visibility || entry.visibility.length === 0
                ? "Staff only"
                : entry.visibility.join(", ")}
            </span>
          )}

          <span className="text-xs text-muted-foreground">
            {entry.web_response_count} web response
            {entry.web_response_count !== 1 ? "s" : ""}
            {entry.response_count > 0 && (
              <> · {entry.response_count} via Discord</>
            )}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {expanded ? "Hide responses" : "View responses"}
        </Button>

        {expanded && (
          <div className="space-y-3 pt-1">
            <Separator />

            {loadingResponses && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}

            {!loadingResponses && responses !== null && (
              <>
                {presentRanks.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground shrink-0">
                      Filter by rank:
                    </span>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={rankFilter}
                      onValueChange={(v) => v && setRankFilter(v)}
                      className="flex-wrap"
                    >
                      <ToggleGroupItem value="all" className="h-6 px-2 text-xs">
                        All
                      </ToggleGroupItem>
                      {presentRanks.map((rank) => (
                        <ToggleGroupItem
                          key={rank}
                          value={rank}
                          className="h-6 px-2 text-xs"
                        >
                          {rank}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                )}

                {filteredResponses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {responses.length === 0
                      ? "No web responses yet."
                      : "No responses match the selected rank."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredResponses.map((resp) => (
                      <ResponseCard
                        key={resp.id}
                        resp={resp}
                        fields={fields ?? []}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StaffSurveysPage() {
  const { user } = useAuth();
  const { hasPermission, pagePermissions } = usePermissions();
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const isSeniorStaff = hasPermission("staff.surveys", "edit", effectiveRoles);

  // Dynamic visibility options: all role IDs/names appearing in any page-permissions config
  const visibilityOptions = useMemo(() => {
    const roleSet = new Set<string>();
    for (const page of Object.values(pagePermissions)) {
      for (const roles of [page.read, page.create, page.edit, page.delete]) {
        for (const r of roles) roleSet.add(r);
      }
    }
    const roleLabels = user?.role_labels ?? {};
    return Array.from(roleSet).map((id) => ({
      value: id,
      label: roleLabels[id] ?? id,
    }));
  }, [pagePermissions, user?.role_labels]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/surveys`, { headers: getAuthHeaders() }).then((r) =>
        r.ok ? (r.json() as Promise<TemplateEntry[]>) : Promise.resolve([])
      ),
      fetch(`${API_URL}/surveys/applications`, { headers: getAuthHeaders() }).then((r) =>
        r.ok ? (r.json() as Promise<TemplateEntry[]>) : Promise.resolve([])
      ),
    ])
      .then(([surveys, apps]) => setTemplates([...surveys, ...apps]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleVisibilityChange(templateId: string, visibility: string[] | null) {
    setTemplates((prev) =>
      prev.map((e) => (e.template_id === templateId ? { ...e, visibility } : e))
    );
  }

  function handleOpenChange(templateId: string, isOpen: boolean) {
    setTemplates((prev) =>
      prev.map((e) => (e.template_id === templateId ? { ...e, is_open: isOpen } : e))
    );
  }

  function handleEdit(templateId: string) {
    setEditId(templateId);
    setEditorOpen(true);
  }

  function handleNew() {
    setEditId(null);
    setEditorOpen(true);
  }

  function handleSaved(saved: TemplateEntry) {
    setTemplates((prev) => {
      const exists = prev.some((e) => e.template_id === saved.template_id);
      if (exists) {
        return prev.map((e) => (e.template_id === saved.template_id ? { ...e, ...saved } : e));
      }
      return [saved, ...prev];
    });
  }

  const TABS: { value: CategoryFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "survey", label: "Surveys" },
    { value: "application", label: "Applications" },
  ];

  const filtered = templates.filter(
    (t) => categoryFilter === "all" || t.category === categoryFilter
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-rs-bold text-4xl text-primary">Surveys & Applications</h1>
          <p className="text-sm text-muted-foreground">
            Manage visibility and review web responses.
          </p>
        </div>
        {isSeniorStaff && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={handleNew}>
            <Plus className="h-4 w-4" />
            New template
          </Button>
        )}
      </div>

      <TemplateEditorDialog
        open={editorOpen}
        editId={editId}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
      />

      <Separator />

      <div className="flex gap-1">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategoryFilter(value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              categoryFilter === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No templates found.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <TemplateCard
              key={entry.template_id}
              entry={entry}
              isSeniorStaff={isSeniorStaff}
              visibilityOptions={visibilityOptions}
              onVisibilityChange={handleVisibilityChange}
              onOpenChange={handleOpenChange}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
