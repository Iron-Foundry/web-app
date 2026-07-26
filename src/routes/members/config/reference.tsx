import { Tabs } from "radix-ui";
import { registerPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { LootSourcesTab } from "@/components/reference/LootSourcesTab";
import { RatesTab } from "@/components/reference/RatesTab";

registerPage({
  id: "staff.reference-data",
  label: "Reference Data",
  description: "Read-only viewer for boss and activity loot tables and Ironman EHP/EHB rates.",
});

const tabTrigger = cn(
  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
  "text-muted-foreground border-transparent hover:text-foreground",
  "data-[state=active]:text-foreground data-[state=active]:border-primary",
);

export function ReferenceDataPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-rs-bold text-2xl text-primary">Reference Data</h2>
        <p className="text-sm text-muted-foreground">
          Read-only loot tables sourced from the OSRS Wiki and Ironman efficiency rates
          from WiseOldMan. Select a source to view its full drop table.
        </p>
      </div>

      <Tabs.Root defaultValue="boss">
        <div className="border-b border-border">
          <Tabs.List className="flex -mb-px">
            <Tabs.Trigger value="boss" className={tabTrigger}>
              Bosses
            </Tabs.Trigger>
            <Tabs.Trigger value="activity" className={tabTrigger}>
              Activities
            </Tabs.Trigger>
            <Tabs.Trigger value="clue" className={tabTrigger}>
              Clues
            </Tabs.Trigger>
            <Tabs.Trigger value="rates" className={tabTrigger}>
              Rates
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        <Tabs.Content value="boss" className="pt-4">
          <LootSourcesTab category="boss" />
        </Tabs.Content>
        <Tabs.Content value="activity" className="pt-4">
          <LootSourcesTab category="activity" />
        </Tabs.Content>
        <Tabs.Content value="clue" className="pt-4">
          <LootSourcesTab category="clue" />
        </Tabs.Content>
        <Tabs.Content value="rates" className="pt-4">
          <RatesTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
