import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TierEditor } from "./TierEditor";
import { ActivityEditor } from "./ActivityEditor";
import { MilestoneEditor } from "./MilestoneEditor";
import { MultiplierEditor } from "./MultiplierEditor";
import { FrenzyVersionHistoryDialog } from "../FrenzyVersionHistoryDialog";
import { useCalculatePoints, useCreateTemplate, useUpdateTemplate } from "@/hooks/useFrenzy";
import type { FrenzyTemplate, FrenzyTemplateUpdate } from "@/types/frenzy";
import { History, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

const TABS = ["Tiers", "Activities", "Milestones", "Multipliers"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  template?: FrenzyTemplate;
  onSaved: () => void;
  onCancel: () => void;
}

function emptyDraft(): FrenzyTemplateUpdate {
  return {
    name: "",
    description: null,
    tiers: {},
    activities: [],
    milestones: {},
    multipliers: [],
    total_point_cap: 0,
  };
}

export function TemplateEditor({ template, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState<FrenzyTemplateUpdate>(
    template
      ? {
          name: template.name,
          description: template.description,
          tiers: template.tiers,
          activities: template.activities,
          milestones: template.milestones,
          multipliers: template.multipliers,
          total_point_cap: template.total_point_cap,
        }
      : emptyDraft(),
  );
  const [activeTab, setActiveTab] = useState<Tab>("Tiers");
  const [historyOpen, setHistoryOpen] = useState(false);

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const calculatePoints = useCalculatePoints();

  const isPending = createTemplate.isPending || updateTemplate.isPending;
  const tierBudgetSum = Object.values(draft.tiers).reduce((s, t) => s + (t.budget_pct ?? 0), 0);
  const canRecalculate =
    draft.total_point_cap > 0 &&
    Math.abs(tierBudgetSum - 100) < 0.01 &&
    !calculatePoints.isPending;

  async function handleRecalculate() {
    try {
      const result = await calculatePoints.mutateAsync({
        tiers: draft.tiers,
        total_point_cap: draft.total_point_cap,
      });
      setDraft((d) => ({ ...d, tiers: result.tiers }));
      toast.success("Points recalculated. Review and save to apply.");
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function handleSave() {
    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, data: draft });
        toast.success("Template saved.");
      } else {
        await createTemplate.mutateAsync(draft);
        toast.success("Template created.");
      }
      onSaved();
    } catch (err) {
      toast.error(String(err));
    }
  }

  function set<K extends keyof FrenzyTemplateUpdate>(key: K, value: FrenzyTemplateUpdate[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div>
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Template name"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label>Point Cap</Label>
            <Input
              type="number"
              min={0}
              value={draft.total_point_cap}
              onChange={(e) => set("total_point_cap", Number(e.target.value))}
              placeholder="Total point budget"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {template && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              History
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRecalculate}
            disabled={!canRecalculate}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {calculatePoints.isPending ? "Calculating..." : "Recalculate"}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !draft.name.trim()}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Tiers" && (
        <TierEditor tiers={draft.tiers} onChange={(t) => set("tiers", t)} />
      )}
      {activeTab === "Activities" && (
        <ActivityEditor activities={draft.activities} onChange={(a) => set("activities", a)} />
      )}
      {activeTab === "Milestones" && (
        <MilestoneEditor milestones={draft.milestones} onChange={(m) => set("milestones", m)} />
      )}
      {activeTab === "Multipliers" && (
        <MultiplierEditor
          multipliers={draft.multipliers}
          tiers={draft.tiers}
          onChange={(m) => set("multipliers", m)}
        />
      )}

      {template && (
        <FrenzyVersionHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          templateId={template.id}
          currentData={{
            tiers: draft.tiers,
            activities: draft.activities,
            milestones: draft.milestones,
            multipliers: draft.multipliers,
          }}
          onRestored={() => {
            setHistoryOpen(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
}
