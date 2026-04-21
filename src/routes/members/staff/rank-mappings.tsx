import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { StaffGuard } from "@/components/StaffGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "staff.rank-mappings",
  label: "Rank Mappings",
  description: "Map in-game ranks to Discord roles.",
  defaults: { read: ["Foundry Mentors"], create: [], edit: ["Senior Moderator"], delete: [] },
});

export const staffRankMappingsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/rank-mappings",
  component: () => <StaffGuard pageId="staff.rank-mappings"><RankMappingsPage /></StaffGuard>,
});

interface RankMapping {
  clan_rank: string;
  discord_role_id: string;
  label: string;
  order: number;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function RankMappingsPage() {
  const [mappings, setMappings] = useState<RankMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/config/rank-mappings`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setMappings(
        (data.mappings ?? []).map((m: Partial<RankMapping>) => ({
          clan_rank: m.clan_rank ?? "",
          discord_role_id: m.discord_role_id ?? "",
          label: m.label ?? "",
          order: m.order ?? 0,
        }))
      ))
      .catch(() => setError("Failed to load rank mappings."))
      .finally(() => setLoading(false));
  }, []);

  function update(idx: number, field: keyof RankMapping, val: string | number) {
    setMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));
    setDirty(true);
    setSaved(false);
  }

  function addRow() {
    setMappings((prev) => [...prev, { clan_rank: "", discord_role_id: "", label: "", order: 0 }]);
    setDirty(true);
    setSaved(false);
  }

  function removeRow(idx: number) {
    setMappings((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/config/rank-mappings`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ mappings }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail ?? "Save failed.");
        return;
      }
      const saved_data = await res.json();
      setMappings(saved_data.mappings);
      setDirty(false);
      setSaved(true);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const byRole = mappings.reduce<Record<string, string[]>>((acc, m) => {
    const key = m.label || m.discord_role_id;
    if (key) {
      (acc[key] ??= []).push(m.clan_rank);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Rank Mappings</h1>
        <p className="text-sm text-muted-foreground">
          Link in-game clan ranks to Discord roles. Enter the Discord role ID (snowflake) for
          stability against renames — copy it from Discord Developer Mode or Server Settings.
        </p>
      </div>

      <Separator />

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && (
        <div className="space-y-4">
          {mappings.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_1fr_4rem_2rem] gap-2 px-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In-game rank</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discord Role ID</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order</p>
              <span />
            </div>
          )}

          <div className="space-y-2">
            {mappings.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_4rem_2rem] gap-2 items-center">
                <Input
                  value={m.clan_rank}
                  onChange={(e) => update(i, "clan_rank", e.target.value)}
                  placeholder="e.g. Lieutenant"
                  className="h-8 text-sm"
                />
                <Input
                  value={m.discord_role_id}
                  onChange={(e) => update(i, "discord_role_id", e.target.value)}
                  placeholder="e.g. 123456789"
                  className="h-8 text-sm font-mono"
                />
                <Input
                  value={m.label}
                  onChange={(e) => update(i, "label", e.target.value)}
                  placeholder="e.g. Foundry Mentors"
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  value={m.order}
                  onChange={(e) => update(i, "order", parseInt(e.target.value, 10) || 0)}
                  className="h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => removeRow(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {mappings.length === 0 && (
            <p className="text-sm text-muted-foreground">No mappings defined.</p>
          )}

          <Button variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            Add mapping
          </Button>

          <Separator />

          {Object.keys(byRole).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
              <div className="space-y-1">
                {Object.entries(byRole).map(([role, ranks]) => (
                  <div key={role} className="flex items-baseline gap-2 text-sm">
                    <span className="font-medium text-foreground min-w-[10rem]">{role}</span>
                    <span className="text-muted-foreground">{ranks.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && !dirty && (
            <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
