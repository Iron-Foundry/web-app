import { BossHealthDisplay } from "./BossHealthDisplay";
import type { BossHealthData, RuneLiteConfig } from "@/types/runeliteConfig";

export function BossHealthPreview({ config }: { config: RuneLiteConfig }) {
  return (
    <div className="h-full w-full overflow-y-auto p-2">
      <BossHealthDisplay bosses={config.data as BossHealthData[]} />
    </div>
  );
}
