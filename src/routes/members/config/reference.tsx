import { Tabs } from "radix-ui";
import type { LootCategory } from "@/api/osrsclans";
import { registerPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { LootSourcesTab } from "@/components/reference/LootSourcesTab";
import { RatesTab } from "@/components/reference/RatesTab";

registerPage({
  id: "staff.reference-data",
  label: "Reference Data",
  description: "Drop tables and kill rates from OSRSClans, and Ironman efficiency rates from WiseOldMan.",
});

const tabTrigger = cn(
  "px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
  "text-muted-foreground border-transparent hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-primary",
);

const CATEGORY_TABS: [LootCategory, string][] = [
  ["raid", "Raids"],
  ["boss", "Bosses"],
  ["minigame", "Minigames"],
  ["clue", "Clues"],
  ["skilling", "Skilling"],
  ["monster", "Monsters"],
];

export function ReferenceDataPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-rs-bold text-2xl text-primary">Reference Data</h2>
        <p className="text-sm text-muted-foreground">
          Drop tables and kill rates from OSRSClans, and Ironman efficiency rates from WiseOldMan.
        </p>
      </div>

      <Tabs.Root defaultValue="boss">
        <div className="overflow-x-auto border-b border-border">
          <Tabs.List className="flex -mb-px">
            {CATEGORY_TABS.map(([category, label]) => (
              <Tabs.Trigger key={category} value={category} className={tabTrigger}>
                {label}
              </Tabs.Trigger>
            ))}
            <Tabs.Trigger value="rates" className={tabTrigger}>
              Rates
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        {CATEGORY_TABS.map(([category]) => (
          <Tabs.Content key={category} value={category} className="pt-4">
            <LootSourcesTab category={category} />
          </Tabs.Content>
        ))}
        <Tabs.Content value="rates" className="pt-4">
          <RatesTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
