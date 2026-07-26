import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEfficiencyRates } from "@/hooks/useReference";
import type { EfficiencyKind } from "@/types/reference";

const UNIT: Record<EfficiencyKind, string> = {
  ehb: "kills/hr",
  ehp: "xp/hr",
};

export function RatesTab() {
  const [kind, setKind] = useState<EfficiencyKind>("ehb");
  const { data, isPending, isError } = useEfficiencyRates(kind);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant={kind === "ehb" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setKind("ehb")}
        >
          EHB (bosses)
        </Button>
        <Button
          variant={kind === "ehp" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setKind("ehp")}
        >
          EHP (skills)
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading rates...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Failed to load rates.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {kind} rates ingested yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Metric
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                  Rate ({UNIT[kind]})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((rate) => (
                <tr key={rate.metric} className="hover:bg-muted/20">
                  <td className="px-3 py-2 capitalize">
                    {rate.metric.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {rate.rate.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
