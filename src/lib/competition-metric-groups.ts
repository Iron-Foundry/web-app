import metricsConfig from "@/competition-metrics.toml";
import { RAID_GROUPS } from "./competitions";
import type { TabDescriptor } from "./competitions";

const TOML_GROUPS: { name: string; metrics: string[] }[] = metricsConfig.groups as {
  name: string;
  metrics: string[];
}[];

const RAIDS = "Raids";
const OTHER = "Other";

export const CATEGORY_ORDER = ["Skills", "Bosses", RAIDS, "Activities", "Computed"];

export interface MetricCategory {
  name: string;
  tabs: TabDescriptor[];
}

const METRIC_TO_CATEGORY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const group of TOML_GROUPS) {
    for (const metric of group.metrics) map[metric] = group.name;
  }
  for (const { variants } of Object.values(RAID_GROUPS)) {
    for (const variant of variants) map[variant] = RAIDS;
  }
  return map;
})();

export function tabKey(tab: TabDescriptor): string {
  return tab.kind === "raid" ? tab.groupKey : tab.metric;
}

function categoryOf(tab: TabDescriptor): string {
  if (tab.kind === "raid") return RAIDS;
  return METRIC_TO_CATEGORY[tab.metric] ?? OTHER;
}

/**
 * Splits the metric tabs into the named categories so a competition with many
 * metrics reads as a few short labelled rows instead of one long bar. Raids are
 * lifted out of Bosses, and a metric the config does not know still shows up
 * under Other rather than disappearing.
 */
export function categorizeMetricTabs(tabs: TabDescriptor[]): MetricCategory[] {
  const buckets = new Map<string, TabDescriptor[]>();
  for (const tab of tabs) {
    const name = categoryOf(tab);
    buckets.set(name, [...(buckets.get(name) ?? []), tab]);
  }

  const names = [...CATEGORY_ORDER, ...[...buckets.keys()].filter(isUnordered).sort()];

  return names.flatMap((name) => {
    const found = buckets.get(name);
    if (!found || found.length === 0) return [];
    return [{ name, tabs: [...found].sort((a, b) => a.label.localeCompare(b.label)) }];
  });
}

function isUnordered(name: string): boolean {
  return !CATEGORY_ORDER.includes(name);
}
