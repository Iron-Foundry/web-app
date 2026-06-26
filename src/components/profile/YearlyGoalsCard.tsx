import { useState, useEffect, useRef } from "react";
import { Plus, Target, RefreshCw, Share2, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PresetPicker } from "./PresetPicker";
import { GoalRow } from "./GoalRow";
import { GoalForm, CheckboxGoalForm } from "./GoalForm";
import { getSnapshotCurrent, getClanCurrent, type PresetGoal } from "./presets";
import { useMySnapshot, useMyRankings } from "@/hooks/useMemberDashboard";
import { useAuth } from "@/context/AuthContext";
import { membersApi } from "@/api/members";
import { queryKeys } from "@/lib/queryKeys";
import type { LinkedAccount } from "@/api/accounts";
import type { Goal, GoalFormData } from "@/types/goals";

function applySnapshot(
  goals: Goal[],
  snapshot: { skills: Record<string, number>; bosses: Record<string, number>; activities: Record<string, number> },
): Goal[] {
  return goals.map((g) => {
    if (!g.wmMetricType || !g.wmMetric) return g;
    const raw = g.wmMetricType === "skill_xp"
      ? snapshot.skills[g.wmMetric]
      : g.wmMetricType === "boss_kc"
        ? snapshot.bosses[g.wmMetric]
        : snapshot.activities[g.wmMetric];
    return raw != null ? { ...g, current: Math.round(raw) } : g;
  });
}

/** Yearly goal tracker per linked RSN, synced to backend and shareable. */
export function YearlyGoalsCard({ accounts }: {
  accounts: LinkedAccount[];
}): React.JSX.Element {
  const primary = accounts.find((a) => a.is_primary) ?? accounts[0];
  const year    = new Date().getFullYear();

  const [selectedRsn, setSelectedRsn]       = useState(primary?.rsn ?? "");
  const [goals, setGoals]                   = useState<Goal[]>([]);
  const [addMode, setAddMode]               = useState<"preset" | "form" | "checkbox" | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetGoal | null>(null);
  const [editId, setEditId]                 = useState<string | null>(null);
  const [copied, setCopied]                 = useState(false);

  const fullGoalsRef = useRef<Goal[]>([]);

  const { user }             = useAuth();
  const { data: snapshot }   = useMySnapshot(selectedRsn || null);
  const { data: rankings = [] } = useMyRankings(user?.id);
  const { data: goalsData }  = useQuery({
    queryKey: queryKeys.members.myGoals(selectedRsn),
    queryFn:  () => membersApi.getMyGoals(selectedRsn),
    enabled:  !!selectedRsn,
    staleTime: 1000 * 60 * 5,
  });
  const saveMutation = useMutation({
    mutationFn: ({ rsn, allGoals }: { rsn: string; allGoals: Goal[] }) =>
      membersApi.saveMyGoals(rsn, allGoals),
  });

  useEffect(() => {
    if (!selectedRsn) return;
    setGoals([]);
    fullGoalsRef.current = [];
    setAddMode(null);
    setEditId(null);
  }, [selectedRsn]);

  useEffect(() => {
    if (!goalsData) return;
    const all = goalsData.goals as Goal[];
    fullGoalsRef.current = all;
    setGoals(all.filter((g) => g.year === year));
  }, [goalsData, year]);

  useEffect(() => {
    if (!snapshot) return;
    setGoals((prev) => {
      const updated = applySnapshot(prev, snapshot);
      return updated.some((g, i) => g.current !== prev[i]?.current) ? updated : prev;
    });
  }, [snapshot]);

  function persist(yearGoals: Goal[]): void {
    const otherYears = fullGoalsRef.current.filter((g) => g.year !== year);
    const merged = [...otherYears, ...yearGoals];
    fullGoalsRef.current = merged;
    setGoals(yearGoals);
    if (selectedRsn) saveMutation.mutate({ rsn: selectedRsn, allGoals: merged });
  }

  function handleAdd(data: GoalFormData): void {
    persist([...goals, { ...data, id: crypto.randomUUID(), year }]);
    setAddMode(null);
    setSelectedPreset(null);
  }

  function handlePresetSelect(preset: PresetGoal): void {
    setSelectedPreset(preset);
    setAddMode("form");
  }

  function handleUpdate(id: string, data: GoalFormData): void {
    persist(goals.map((g) => (g.id === id ? { ...g, ...data } : g)));
    setEditId(null);
  }

  function handleAddCheckbox(title: string, category: Goal["category"]): void {
    persist([...goals, { id: crypto.randomUUID(), title, category, type: "checkbox", checked: false, current: 0, target: 1, unit: "", year }]);
    setAddMode(null);
  }

  function handleShare(): void {
    const token = goalsData?.share_token;
    if (!token) return;
    void navigator.clipboard.writeText(`${window.location.origin}/goals/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function cancelAdd(): void { setAddMode(null); setSelectedPreset(null); }

  const presetInitial: Partial<GoalFormData> | undefined = selectedPreset
    ? {
        title:    selectedPreset.title,
        category: selectedPreset.category,
        unit:     selectedPreset.unit,
        current:  selectedPreset.clanMetric
          ? getClanCurrent(selectedPreset, rankings, selectedRsn)
          : (snapshot ? Math.round(getSnapshotCurrent(selectedPreset, snapshot)) : 0),
        wmMetricType: selectedPreset.metricType,
        wmMetric:     selectedPreset.metric,
      }
    : undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-rs-bold text-xl text-primary flex items-center gap-2">
            <Target className="h-4 w-4" />
            {year} Goals
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {selectedRsn && (
              <Button size="sm" variant="ghost" onClick={handleShare} disabled={!goalsData?.share_token} className="text-muted-foreground">
                {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Share2 className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Copied!" : "Share"}
              </Button>
            )}
            {addMode === null && editId === null && (
              <Button size="sm" variant="outline" onClick={() => setAddMode("preset")}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add goal
              </Button>
            )}
          </div>
        </div>
        {accounts.length > 1 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {accounts.map((a) => (
              <button
                key={a.rsn}
                onClick={() => setSelectedRsn(a.rsn)}
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-medium transition-colors border",
                  selectedRsn === a.rsn
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                {a.rsn}
              </button>
            ))}
          </div>
        )}
        {snapshot?.fetched_at && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
            <RefreshCw className="h-3 w-3" />
            WOM data from {new Date(snapshot.fetched_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length === 0 && addMode === null && (
          <p className="text-sm text-muted-foreground italic">No goals set for {year} yet. Track OSRS milestones, clan targets, or anything else.</p>
        )}
        {goals.map((goal) =>
          editId === goal.id
            ? <GoalForm key={goal.id} initial={goal} onSubmit={(data) => handleUpdate(goal.id, data)} onCancel={() => setEditId(null)} />
            : <GoalRow key={goal.id} goal={goal} onEdit={() => setEditId(goal.id)} onDelete={() => persist(goals.filter((g) => g.id !== goal.id))} onProgressUpdate={(c) => persist(goals.map((g) => (g.id === goal.id ? { ...g, current: c } : g)))} onToggleCheck={(checked) => persist(goals.map((g) => (g.id === goal.id ? { ...g, checked } : g)))} />
        )}
        {addMode === "preset"   && <PresetPicker snapshot={snapshot} rankings={rankings} rsn={selectedRsn} onSelect={handlePresetSelect} onCustom={() => { setSelectedPreset(null); setAddMode("form"); }} onCheckbox={() => setAddMode("checkbox")} />}
        {addMode === "form"     && <GoalForm initial={presetInitial} onSubmit={handleAdd} onCancel={cancelAdd} />}
        {addMode === "checkbox" && <CheckboxGoalForm onSubmit={handleAddCheckbox} onCancel={cancelAdd} />}
      </CardContent>
    </Card>
  );
}
