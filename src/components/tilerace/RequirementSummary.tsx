import { itemIconUrl } from "@/components/runelite/bankTag";
import type { RequirementNode } from "@/types/tilerace";

interface RequirementSummaryProps {
  node: RequirementNode;
  depth?: number;
}

const GROUP_LABEL: Record<"and" | "or" | "not", string> = {
  and: "Needs all of:",
  or: "Needs any one of:",
  not: "Must not have:",
};

export function RequirementSummary({
  node,
  depth = 0,
}: RequirementSummaryProps): JSX.Element {
  if (node.kind === "item") {
    return (
      <div className="flex items-center gap-1.5">
        <img
          src={itemIconUrl(node.item_id)}
          alt={node.name}
          className="h-4 w-4 object-contain shrink-0"
        />
        <span className="text-xs truncate">{node.name || `Item ${node.item_id}`}</span>
        {node.quantity > 1 && (
          <span className="text-xs text-muted-foreground shrink-0">
            x{node.quantity}
          </span>
        )}
      </div>
    );
  }

  if (node.kind === "text") {
    return <p className="text-xs whitespace-pre-wrap">{node.text}</p>;
  }

  const children = node.kind === "not" ? [node.child] : node.children;

  return (
    <div className={depth > 0 ? "border-l border-border/60 pl-2" : ""}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {GROUP_LABEL[node.kind]}
      </span>
      <div className="space-y-1 pt-0.5">
        {children.map((child, i) => (
          <RequirementSummary key={i} node={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}
