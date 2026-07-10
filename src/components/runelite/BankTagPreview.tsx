import { BankTagDisplay } from "./BankTagDisplay";
import type { RuneLiteConfig } from "@/types/runeliteConfig";

export function BankTagPreview({ config }: { config: RuneLiteConfig }) {
  return (
    <div className="h-full w-full overflow-y-auto p-2">
      <BankTagDisplay raw={(config.data[0] as string) ?? ""} />
    </div>
  );
}
