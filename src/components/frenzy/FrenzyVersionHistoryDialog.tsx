import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTemplateVersions, useTemplateVersion, useRevertTemplate } from "@/hooks/useFrenzy";
import { diffLines } from "@/lib/lineDiff";
import type { FrenzyVersionSummary } from "@/types/frenzyTemplate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number;
  templateName: string;
  currentData: object;
  onRestored: () => void;
}

const LINE_CLASS = {
  same: "",
  old: "bg-red-500/15 text-red-600 dark:text-red-400",
  new: "bg-green-500/15 text-green-600 dark:text-green-400",
};

/** The lines of the picked version against the current draft: red only in the version, green only in the draft. */
function JsonDiff({ version, current }: { version: object; current: object }): React.ReactElement {
  const lines = diffLines(JSON.stringify(version, null, 2).split("\n"), JSON.stringify(current, null, 2).split("\n"));
  return (
    <pre className="text-xs font-mono overflow-auto max-h-[400px] bg-muted/50 rounded p-3 leading-5">
      {lines.map((d, i) => (
        <span key={i} className={`block px-1 ${LINE_CLASS[d.kind]}`}>
          {d.text}
        </span>
      ))}
    </pre>
  );
}

function VersionButton({ v, active, onPick }: { v: FrenzyVersionSummary; active: boolean; onPick: () => void }): React.ReactElement {
  return (
    <button type="button" onClick={onPick}
      className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-muted text-foreground" : "hover:bg-muted/50 text-muted-foreground"}`}>
      <div className="font-medium">v{v.version_number}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{new Date(v.created_at).toLocaleDateString()}</div>
      {v.edited_by && <div className="text-xs text-muted-foreground truncate">{v.edited_by.rsn ?? v.edited_by.discord_username}</div>}
    </button>
  );
}

export function FrenzyVersionHistoryDialog({ open, onOpenChange, templateId, templateName, currentData, onRestored }: Props): React.ReactElement {
  const [selected, setSelected] = useState<FrenzyVersionSummary | null>(null);
  const { data: versions, isLoading } = useTemplateVersions(open ? templateId : 0);
  const { data: detail } = useTemplateVersion(templateId, selected?.id ?? 0);
  const revert = useRevertTemplate();
  const latest = versions ? Math.max(...versions.map((v) => v.version_number)) : 0;

  async function restore(): Promise<void> {
    if (!selected) return;
    await revert.mutateAsync({ id: templateId, vid: selected.id });
    onRestored();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Version history · {templateName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden md:flex-row">
          <div className="max-h-40 shrink-0 overflow-y-auto border-b p-2 space-y-1 md:max-h-none md:w-56 md:border-b-0 md:border-r">
            {isLoading && <p className="p-2 text-sm text-muted-foreground">Loading...</p>}
            {(versions ?? []).map((v) => (
              <VersionButton key={v.id} v={v} active={selected?.id === v.id} onPick={() => setSelected(v)} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!selected && <p className="text-sm text-muted-foreground">Select a version to compare.</p>}
            {selected && !detail && <p className="text-sm text-muted-foreground">Loading version...</p>}
            {selected && detail && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-sm">v{detail.version_number} compared with the current draft</h3>
                  <Button size="sm" variant="outline" disabled={detail.version_number === latest || revert.isPending} onClick={restore}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Restore this version
                  </Button>
                </div>
                <JsonDiff
                  version={{ tiers: detail.tiers, activities: detail.activities, milestones: detail.milestones, multipliers: detail.multipliers }}
                  current={currentData}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
