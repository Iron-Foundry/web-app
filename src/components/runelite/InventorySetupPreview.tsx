import { InventorySetupDisplay } from "./InventorySetupDisplay";
import type { InventorySetup, RuneLiteConfig } from "@/types/runeliteConfig";

export function InventorySetupPreview({ config }: { config: RuneLiteConfig }) {
  const setup = config.data[0] as InventorySetup | undefined;
  return (
    <div className="h-full w-full overflow-y-auto p-2">
      {setup && <InventorySetupDisplay setup={setup} />}
    </div>
  );
}
