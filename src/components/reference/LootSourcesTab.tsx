import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLootSources } from "@/hooks/useReference";
import type { LootCategory, LootSource } from "@/types/reference";
import { cn } from "@/lib/utils";
import { DropTable } from "./DropTable";

function SourceRow({
  source,
  expanded,
  onToggle,
}: {
  source: LootSource;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-muted/20"
        onClick={onToggle}
      >
        <td className="px-3 py-2">
          <span className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {source.display_name}
          </span>
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
          {source.drop_count}
        </td>
        <td className="px-3 py-2 text-right text-xs text-muted-foreground">
          {new Date(source.updated_at).toLocaleDateString()}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={3} className="p-0">
            <DropTable slug={source.slug} />
          </td>
        </tr>
      )}
    </>
  );
}

export function LootSourcesTab({ category }: { category: LootCategory }) {
  const { data, isPending, isError } = useLootSources(category);
  const [selected, setSelected] = useState<string | null>(null);

  if (isPending)
    return <p className="text-sm text-muted-foreground">Loading sources...</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load sources.</p>;
  if (!data || data.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No {category} loot tables ingested yet.
      </p>
    );

  return (
    <div className={cn("overflow-x-auto rounded-md border border-border")}>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Source
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
              Drops
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((source) => (
            <SourceRow
              key={source.slug}
              source={source}
              expanded={selected === source.slug}
              onToggle={() =>
                setSelected(selected === source.slug ? null : source.slug)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
