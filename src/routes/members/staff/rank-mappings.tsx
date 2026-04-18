import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

export const staffRankMappingsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/rank-mappings",
  component: RankMappingsPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface RankMapping {
  clan_rank: string;
  discord_role: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
      .then((data) => setMappings(data.mappings ?? []))
      .catch(() => setError("Failed to load rank mappings."))
      .finally(() => setLoading(false));
  }, []);

  function update(idx: number, field: keyof RankMapping, val: string) {
    setMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));
    setDirty(true);
    setSaved(false);
  }

  function addRow() {
    setMappings((prev) => [...prev, { clan_rank: "", discord_role: "" }]);
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

  // Group by discord_role for display — but edit as a flat list
  const byRole = mappings.reduce<Record<string, string[]>>((acc, m) => {
    if (m.discord_role) {
      (acc[m.discord_role] ??= []).push(m.clan_rank);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Rank Mappings</h1>
        <p className="text-sm text-muted-foreground">
          Link in-game clan ranks to Discord roles. Multiple in-game ranks can
          map to the same Discord role.
        </p>
      </div>

      <Separator />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && (
        <div className="space-y-4">
          {/* Column headers */}
          {mappings.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_2rem] gap-3 px-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                In-game rank
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Discord role
              </p>
            </div>
          )}

          {/* Mapping rows */}
          <div className="space-y-2">
            {mappings.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_2rem] gap-3 items-center">
                <Input
                  value={m.clan_rank}
                  onChange={(e) => update(i, "clan_rank", e.target.value)}
                  placeholder="e.g. Lieutenant"
                  className="h-8 text-sm"
                />
                <Input
                  value={m.discord_role}
                  onChange={(e) => update(i, "discord_role", e.target.value)}
                  placeholder="e.g. Moderator"
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

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addRow}
          >
            <Plus className="h-3.5 w-3.5" />
            Add mapping
          </Button>

          <Separator />

          {/* Preview grouped by Discord role */}
          {Object.keys(byRole).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Preview
              </p>
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
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
