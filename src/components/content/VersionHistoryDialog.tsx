import { useEffect, useState } from "react";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface VersionEditor {
  discord_user_id: number | null;
  discord_username: string | null;
  rsn: string | null;
  avatar: string | null;
}

interface VersionSummary {
  id: number;
  version_number: number;
  title: string;
  created_at: string;
  edited_by: VersionEditor | null;
}

interface VersionDetail extends VersionSummary {
  body: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageType: string;
  entryId: string;
  onRestored: () => void;
}

export function VersionHistoryDialog({ open, onOpenChange, pageType, entryId, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VersionDetail | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [reverting, setReverting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVersions([]);
    setSelected(null);
    setLoading(true);
    const token = getAuthToken();
    fetch(`${API_URL}/content/${pageType}/entries/${entryId}/versions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json() as Promise<VersionSummary[]>)
      .then(setVersions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, pageType, entryId]);

  async function selectVersion(v: VersionSummary) {
    if (selected?.id === v.id) return;
    setLoadingBody(true);
    const token = getAuthToken();
    try {
      const r = await fetch(
        `${API_URL}/content/${pageType}/entries/${entryId}/versions/${v.id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const detail = await r.json() as VersionDetail;
      setSelected(detail);
    } catch {
      // ignore
    } finally {
      setLoadingBody(false);
    }
  }

  async function handleRevert() {
    if (!selected) return;
    setReverting(true);
    const token = getAuthToken();
    try {
      await fetch(
        `${API_URL}/content/${pageType}/entries/${entryId}/revert/${selected.id}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      onRestored();
      onOpenChange(false);
    } catch {
      // ignore
    } finally {
      setReverting(false);
    }
  }

  const latestVersionNumber = versions[0]?.version_number;
  const isLatest = selected !== null && selected.version_number === latestVersionNumber;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left panel — version list */}
          <div className="w-52 shrink-0 border-r border-border overflow-y-auto">
            {loading && (
              <p className="text-xs text-muted-foreground p-3">Loading…</p>
            )}
            {!loading && versions.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">No versions yet.</p>
            )}
            {versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => selectVersion(v)}
                className={`w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/60 transition-colors text-xs ${selected?.id === v.id ? "bg-muted" : ""}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono font-semibold text-primary">V{v.version_number}</span>
                  {i === 0 && (
                    <span className="text-muted-foreground text-[10px]">Current</span>
                  )}
                </div>
                <div className="text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</div>
                {v.edited_by && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {v.edited_by.avatar && (
                      <img src={v.edited_by.avatar} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                    )}
                    <span className="truncate">{v.edited_by.rsn ?? v.edited_by.discord_username ?? "Unknown"}</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Right panel — preview */}
          <div className="flex-1 overflow-auto p-4">
            {!selected && !loadingBody && (
              <p className="text-sm text-muted-foreground italic">Select a version to preview.</p>
            )}
            {loadingBody && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {selected && !loadingBody && (
              <MarkdownRenderer body={selected.body} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border shrink-0 flex justify-end">
          <Button
            size="sm"
            disabled={!selected || isLatest || reverting}
            onClick={handleRevert}
          >
            {reverting ? "Restoring…" : "Restore this version"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
