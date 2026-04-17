import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { hasMinRank, highestRole, DISCORD_ROLE_ORDER } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";

export const staffSurveysRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/surveys",
  component: StaffSurveysPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateEntry {
  template_id: string;
  title: string;
  description: string | null;
  visibility: string | null;
  category: "survey" | "application";
  is_active: boolean;
  response_count: number;
  web_response_count: number;
  user_submitted: boolean;
}

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

const VISIBILITY_OPTIONS = [
  { value: "staff_only", label: "Staff only" },
  { value: "Mentor", label: "Mentor" },
  { value: "Event Team", label: "Event Team" },
  { value: "Moderator", label: "Moderator" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAnswer(val: unknown): string {
  if (val === undefined || val === null || val === "") return "—";
  if (Array.isArray(val)) return (val as string[]).join(", ");
  return String(val);
}

// ── ResponseCard ──────────────────────────────────────────────────────────────

function ResponseCard({ resp, fields }: { resp: ResponseEntry; fields: Field[] }) {
  const [open, setOpen] = useState(false);
  const rank = highestRole(resp.discord_roles);
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

// ── TemplateCard ──────────────────────────────────────────────────────────────

function TemplateCard({
  entry,
  isSeniorStaff,
  onVisibilityChange,
}: {
  entry: TemplateEntry;
  isSeniorStaff: boolean;
  onVisibilityChange: (templateId: string, visibility: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<Field[] | null>(null);
  const [responses, setResponses] = useState<ResponseEntry[] | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [rankFilter, setRankFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const isOpen = entry.visibility !== null;

  // Lazy-fetch responses + fields on first expand
  useEffect(() => {
    if (!expanded || responses !== null) return;
    setLoadingResponses(true);
    Promise.all([
      fetch(`${API_URL}/surveys/${entry.template_id}/responses`, {
        headers: authHeaders(),
      }).then((r) => (r.ok ? (r.json() as Promise<ResponseEntry[]>) : Promise.resolve([]))),
      fetch(`${API_URL}/surveys/${entry.template_id}`, {
        headers: authHeaders(),
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

  async function handleVisibilityChange(next: string) {
    setSaving(true);
    const body = { visibility: next === "staff_only" ? null : next };
    await fetch(`${API_URL}/surveys/${entry.template_id}/visibility`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onVisibilityChange(entry.template_id, body.visibility);
  }

  // Ranks present in responses, ordered by DISCORD_ROLE_ORDER
  const presentRanks = responses
    ? (DISCORD_ROLE_ORDER as readonly string[]).filter((rank) =>
        responses.some((r) => highestRole(r.discord_roles) === rank)
      )
    : [];

  const filteredResponses =
    responses === null
      ? []
      : rankFilter === "all"
        ? responses
        : responses.filter((r) => highestRole(r.discord_roles) === rankFilter);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="font-rs-bold text-lg text-primary leading-tight">{entry.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {entry.category}
            </Badge>
            {isOpen ? (
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

        {/* Controls row */}
        <div className="flex items-center gap-4 flex-wrap">
          {isSeniorStaff ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Visible to:</span>
              <Select
                value={entry.visibility ?? "staff_only"}
                onValueChange={handleVisibilityChange}
                disabled={saving}
              >
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Visible to: {entry.visibility ?? "Staff only"}
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

        {/* Expand toggle */}
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

        {/* Responses section */}
        {expanded && (
          <div className="space-y-3 pt-1">
            <Separator />

            {loadingResponses && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}

            {!loadingResponses && responses !== null && (
              <>
                {/* Rank filter */}
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

// ── Page ──────────────────────────────────────────────────────────────────────

function StaffSurveysPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const isSeniorStaff = user ? hasMinRank(user.discord_roles, "Senior Moderator") : false;

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/surveys`, { headers: authHeaders() }).then((r) =>
        r.ok ? (r.json() as Promise<TemplateEntry[]>) : Promise.resolve([])
      ),
      fetch(`${API_URL}/surveys/applications`, { headers: authHeaders() }).then((r) =>
        r.ok ? (r.json() as Promise<TemplateEntry[]>) : Promise.resolve([])
      ),
    ])
      .then(([surveys, apps]) => setTemplates([...surveys, ...apps]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleVisibilityChange(templateId: string, visibility: string | null) {
    setTemplates((prev) =>
      prev.map((e) => (e.template_id === templateId ? { ...e, visibility } : e))
    );
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
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Surveys & Applications</h1>
        <p className="text-sm text-muted-foreground">
          Manage visibility and review web responses.
        </p>
      </div>

      <Separator />

      {/* Category tabs */}
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
              onVisibilityChange={handleVisibilityChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
