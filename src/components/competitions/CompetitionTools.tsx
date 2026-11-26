import { useState } from "react";
import { Eye } from "lucide-react";
import { fmtCompetitionLabel, type TabDescriptor } from "@/lib/competitions";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Competition } from "@/types/competitions";
import metricsConfig from "@/competition-metrics.toml";

const METRIC_GROUPS: { name: string; metrics: string[] }[] = metricsConfig.groups;

/** A grouped list of every metric, to preview the standings of one the competition does not track. */
export function PreviewAsSelect({ onSelect }: { onSelect: (metric: string) => void }): React.ReactElement {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="h-9 w-52 gap-1.5 text-sm">
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Preview metric..." />
      </SelectTrigger>
      <SelectContent>
        {METRIC_GROUPS.map((group) => (
          <SelectGroup key={group.name}>
            <SelectLabel>{group.name}</SelectLabel>
            {group.metrics.map((m) => <SelectItem key={m} value={m}>{fmtCompetitionLabel(m)}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The Export Top 5 action: downloads the top five image of the active tab's metrics. */
export function useExport(selected: Competition | undefined, resolvedId: string, activeTab: TabDescriptor | undefined) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const exportMetrics = activeTab?.kind === "raid" ? activeTab.variants : activeTab?.metric ? [activeTab.metric] : [];
  const exportLabel = activeTab?.kind === "raid" ? activeTab.label : undefined;

  async function handleExport(): Promise<void> {
    if (!selected || exportMetrics.length === 0) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ id: resolvedId });
      for (const m of exportMetrics) params.append("metric", m);
      if (exportLabel) params.set("label", exportLabel);
      const res = await fetch(`/embed/competition-top5.png?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.title.replace(/\s+/g, "-")}-top5.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    } finally {
      setExporting(false);
    }
  }

  return { exportMetrics, handleExport, exporting, exportError };
}
