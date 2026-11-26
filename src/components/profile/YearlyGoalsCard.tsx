import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { GoalsCardHead } from "./GoalsCardHead";
import { applySnapshot } from "./goalSnapshot";
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
  const { data: rankings = [] } = useMyRankings(user?.discord_user_id);
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
      <GoalsCardHead
        year={year}
        accounts={accounts}
        selectedRsn={selectedRsn}
        onSelectRsn={setSelectedRsn}
        copied={copied}
        canShare={!!goalsData?.share_token}
        onShare={handleShare}
        showAdd={addMode === null && editId === null}
        onAdd={() => setAddMode("preset")}
        fetchedAt={snapshot?.fetched_at}
      />
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
