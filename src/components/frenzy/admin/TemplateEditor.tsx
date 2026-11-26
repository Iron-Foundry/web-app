import { useState } from "react";
import { toast } from "sonner";
import { ActivityEditor } from "./ActivityEditor";
import { CardEditor } from "./CardEditor";
import { MilestoneEditor } from "./MilestoneEditor";
import { MultiplierEditor } from "./MultiplierEditor";
import { TemplateSummary } from "./TemplateSummary";
import { TemplateTree, type CardRef } from "./TemplateTree";
import { FrenzyVersionHistoryDialog } from "../FrenzyVersionHistoryDialog";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/useFrenzyTemplates";
import { orderedTiers } from "@/lib/frenzyCard";
import { assignItemPoints } from "@/lib/frenzyPoints";
import type { FrenzySource, FrenzyTemplate, FrenzyTemplateUpdate } from "@/types/frenzyTemplate";

const TABS = ["Items", "Activities", "Milestones", "Multipliers"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  template?: FrenzyTemplate;
  onSaved: () => void;
  onCancel: () => void;
}

function draftOf(template?: FrenzyTemplate): FrenzyTemplateUpdate {
  if (!template) return { name: "", description: null, tiers: {}, activities: [], milestones: {}, multipliers: [] };
  const { name, description, tiers, activities, milestones, multipliers } = template;
  return { name, description, tiers: assignItemPoints(tiers), activities, milestones, multipliers };
}

function firstCard(tiers: FrenzyTemplateUpdate["tiers"]): CardRef | null {
  const hit = orderedTiers(tiers).find(([, t]) => t.sources.length > 0);
  return hit ? { tier: hit[0], index: 0 } : null;
}

export function TemplateEditor({ template, onSaved, onCancel }: Props): React.ReactElement {
  const [draft, setDraft] = useState<FrenzyTemplateUpdate>(() => draftOf(template));
  const [tab, setTab] = useState<Tab>("Items");
  const [selected, setSelected] = useState<CardRef | null>(() => firstCard(draft.tiers));
  const [historyOpen, setHistoryOpen] = useState(false);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const card = selected ? draft.tiers[selected.tier]?.sources[selected.index] : undefined;

  function set<K extends keyof FrenzyTemplateUpdate>(key: K, value: FrenzyTemplateUpdate[K]): void {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setTiers(tiers: FrenzyTemplateUpdate["tiers"]): void {
    set("tiers", assignItemPoints(tiers));
  }

  function setCards(tier: string, sources: FrenzySource[]): void {
    setTiers({ ...draft.tiers, [tier]: { ...draft.tiers[tier]!, sources } });
  }

  async function save(): Promise<void> {
    try {
      if (template) await updateTemplate.mutateAsync({ id: template.id, data: draft });
      else await createTemplate.mutateAsync(draft);
      toast.success(template ? "Template saved." : "Template created.");
      onSaved();
    } catch (err) {
      toast.error(String(err));
    }
  }

  const summary = (
    <TemplateSummary
      draft={draft}
      version={template?.version_number ?? null}
      set={set}
      isSaving={createTemplate.isPending || updateTemplate.isPending}
      onHistory={template ? () => setHistoryOpen(true) : null}
      onCancel={onCancel}
      onSave={save}
    />
  );

  return (
    <div className="space-y-4">
      <nav className="flex border-b border-border" aria-label="Template sections">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </nav>
      {tab === "Items" ? (
        <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_16rem]">
          <TemplateTree tiers={draft.tiers} selected={selected} onSelect={setSelected} onChange={setTiers} />
          {card && selected ? (
            <CardEditor
              tierName={selected.tier}
              source={card}
              onUpdate={(next) => setCards(selected.tier, draft.tiers[selected.tier]!.sources.map((s, i) => (i === selected.index ? next : s)))}
              onRemove={() => {
                setCards(selected.tier, draft.tiers[selected.tier]!.sources.filter((_, i) => i !== selected.index));
                setSelected(null);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Add a tier and a card to start.</p>
          )}
          {summary}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            {tab === "Activities" && <ActivityEditor activities={draft.activities} onChange={(a) => set("activities", a)} />}
            {tab === "Milestones" && <MilestoneEditor milestones={draft.milestones} onChange={(m) => set("milestones", m)} />}
            {tab === "Multipliers" && <MultiplierEditor multipliers={draft.multipliers} tiers={draft.tiers} onChange={(m) => set("multipliers", m)} />}
          </div>
          {summary}
        </div>
      )}
      {template && (
        <FrenzyVersionHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          templateId={template.id}
          templateName={template.name}
          currentData={{ tiers: draft.tiers, activities: draft.activities, milestones: draft.milestones, multipliers: draft.multipliers }}
          onRestored={() => {
            setHistoryOpen(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
}
