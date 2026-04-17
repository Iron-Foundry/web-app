import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import { hasMinRank } from "@/lib/ranks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const membersApplicationsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/applications",
  component: ApplicationsPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApplicationEntry {
  template_id: string;
  title: string;
  description: string | null;
  visibility: string | null;
  category: "survey" | "application";
  is_active: boolean;
  created_at: string | null;
  response_count?: number;
}

const VISIBILITY_OPTIONS = [
  { value: "staff_only", label: "Staff only" },
  { value: "Mentor", label: "Mentor" },
  { value: "Event Team", label: "Event Team" },
  { value: "Moderator", label: "Moderator" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function visibilityLabel(v: string | null): string {
  if (!v) return "Staff only";
  return v;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VisibilitySelect({
  templateId,
  current,
  onSaved,
}: {
  templateId: string;
  current: string | null;
  onSaved: (templateId: string, visibility: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const value = current ?? "staff_only";

  async function handleChange(next: string) {
    setSaving(true);
    const body = { visibility: next === "staff_only" ? null : next };
    await fetch(`${API_URL}/surveys/${templateId}/visibility`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onSaved(templateId, body.visibility);
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={saving}>
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
  );
}

function ApplicationCard({
  entry,
  isSeniorStaff,
  onVisibilityChange,
}: {
  entry: ApplicationEntry;
  isSeniorStaff: boolean;
  onVisibilityChange: (templateId: string, visibility: string | null) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="font-rs-bold text-lg text-primary leading-tight">
            {entry.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {entry.is_active && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
            {entry.response_count !== undefined && (
              <Badge variant="secondary" className="text-xs tabular-nums">
                {entry.response_count} response{entry.response_count !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {entry.description && (
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        )}
        {isSeniorStaff && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Visible to:</span>
            <VisibilitySelect
              templateId={entry.template_id}
              current={entry.visibility}
              onSaved={onVisibilityChange}
            />
          </div>
        )}
        {!isSeniorStaff && (
          <p className="text-xs text-muted-foreground">
            Visible to: {visibilityLabel(entry.visibility)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ApplicationsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ApplicationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isSeniorStaff = user
    ? hasMinRank(user.discord_roles, "Senior Moderator")
    : false;

  useEffect(() => {
    fetch(`${API_URL}/surveys/applications`, { headers: authHeaders() })
      .then((r) => (r.ok ? (r.json() as Promise<ApplicationEntry[]>) : Promise.reject()))
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleVisibilityChange(templateId: string, visibility: string | null) {
    setEntries((prev) =>
      prev.map((e) => (e.template_id === templateId ? { ...e, visibility } : e))
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Open applications for clan roles and events.
        </p>
      </div>

      <Separator />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No open applications.</p>
      )}

      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <ApplicationCard
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
