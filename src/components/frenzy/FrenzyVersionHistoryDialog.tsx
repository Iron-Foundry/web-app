import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTemplateVersions, useTemplateVersion, useRevertTemplate } from "@/hooks/useFrenzy";
import type { FrenzyVersionSummary } from "@/types/frenzy";
import { RotateCcw } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number;
  currentData: object;
  onRestored: () => void;
}

function JsonDiff({ before, after }: { before: object; after: object }) {
  const beforeStr = JSON.stringify(before, null, 2);
  const afterStr = JSON.stringify(after, null, 2);

  const beforeLines = beforeStr.split("\n");
  const afterLines = afterStr.split("\n");

  // Simple line-based diff - highlight lines that differ
  const diffLines: Array<{ line: string; type: "added" | "removed" | "same" }> = [];

  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);

  for (let i = 0; i < afterLines.length; i++) {
    const line = afterLines[i] ?? "";
    if (!beforeSet.has(line)) {
      diffLines.push({ line, type: "added" });
    } else {
      diffLines.push({ line, type: "same" });
    }
  }

  return (
    <pre className="text-xs font-mono overflow-auto max-h-[400px] bg-muted/50 rounded p-3 leading-5">
      {diffLines.map((d, i) => (
        <span
          key={i}
          className={`block ${
            d.type === "added"
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : ""
          }`}
        >
          {d.line}
        </span>
      ))}
    </pre>
  );
}

export function FrenzyVersionHistoryDialog({
  open,
  onOpenChange,
  templateId,
  currentData,
  onRestored,
}: Props) {
  const [selectedVersion, setSelectedVersion] = useState<FrenzyVersionSummary | null>(null);
  const [selectedVid, setSelectedVid] = useState(0);

  const { data: versions, isLoading } = useTemplateVersions(open ? templateId : 0);
  const { data: versionDetail } = useTemplateVersion(
    templateId,
    selectedVid,
  );
  const revert = useRevertTemplate();

  function handleSelectVersion(v: FrenzyVersionSummary) {
    setSelectedVersion(v);
    setSelectedVid(v.id);
  }

  async function handleRevert() {
    if (!selectedVersion) return;
    await revert.mutateAsync({ id: templateId, vid: selectedVersion.id });
    onRestored();
    onOpenChange(false);
  }

  const isLatest = versions && selectedVersion?.version_number === Math.max(...versions.map((v) => v.version_number));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Version list */}
          <div className="w-56 shrink-0 border-r overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="p-2 space-y-1">
                {(versions ?? []).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVersion(v)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                      selectedVersion?.id === v.id
                        ? "bg-muted text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">v{v.version_number}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.created_at).toLocaleDateString()}
                    </div>
                    {v.edited_by && (
                      <div className="text-xs text-muted-foreground truncate">
                        {v.edited_by.rsn ?? v.edited_by.discord_username}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diff panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedVersion ? (
              <p className="text-sm text-muted-foreground">Select a version to compare.</p>
            ) : versionDetail ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">
                    v{versionDetail.version_number} vs current
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLatest || revert.isPending}
                    onClick={handleRevert}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Restore this version
                  </Button>
                </div>
                <JsonDiff
                  before={currentData}
                  after={{
                    tiers: versionDetail.tiers,
                    activities: versionDetail.activities,
                    milestones: versionDetail.milestones,
                    multipliers: versionDetail.multipliers,
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading version...</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
