import { useMemo } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categorizeMetricTabs, tabKey } from "@/lib/competition-metric-groups";
import type { TabDescriptor } from "@/lib/competitions";

interface MetricTabGroupsProps {
  tabs: TabDescriptor[];
  value: string;
  onValueChange: (value: string) => void;
}

export function MetricTabGroups({
  tabs,
  value,
  onValueChange,
}: MetricTabGroupsProps): JSX.Element {
  const categories = useMemo(() => categorizeMetricTabs(tabs), [tabs]);

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.name} className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category.name}
          </h3>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={value}
            onValueChange={onValueChange}
            className="w-full flex-wrap justify-start"
          >
            {category.tabs.map((tab) => (
              <ToggleGroupItem key={tabKey(tab)} value={tabKey(tab)}>
                {tab.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}
    </div>
  );
}
