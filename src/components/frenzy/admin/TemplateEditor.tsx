import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TierEditor } from "./TierEditor";
import { ActivityEditor } from "./ActivityEditor";
import { MilestoneEditor } from "./MilestoneEditor";
import { MultiplierEditor } from "./MultiplierEditor";
import { FrenzyVersionHistoryDialog } from "../FrenzyVersionHistoryDialog";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/useFrenzy";
import type { FrenzyTemplate, FrenzyTemplateUpdate } from "@/types/frenzy";
import { History, Save } from "lucide-react";
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
        }
      : emptyDraft(),
  );
  const [activeTab, setActiveTab] = useState<Tab>("Tiers");
  const [historyOpen, setHistoryOpen] = useState(false);

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const isPending = createTemplate.isPending || updateTemplate.isPending;

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
        <div className="flex-1 grid grid-cols-2 gap-2">
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
