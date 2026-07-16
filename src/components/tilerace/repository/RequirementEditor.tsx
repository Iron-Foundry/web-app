import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { ItemSearch } from "./ItemSearch";
import { itemIconUrl } from "@/components/runelite/bankTag";
import type { RequirementNode } from "@/types/tilerace";

interface RequirementEditorProps {
  node: RequirementNode;
  onChange: (node: RequirementNode) => void;
  onRemove?: () => void;
}

const ADD_GROUPS: Array<{ label: string; make: () => RequirementNode }> = [
  { label: "+ All-of group", make: () => ({ kind: "and", children: [] }) },
  { label: "+ Any-of group", make: () => ({ kind: "or", children: [] }) },
  { label: "+ Not group", make: () => ({ kind: "not", child: { kind: "and", children: [] } }) },
];

const GROUP_HINT: Record<"and" | "or" | "not", string> = {
  and: "Player needs every requirement below.",
  or: "Player needs at least one requirement below.",
  not: "Player must NOT meet the requirement below.",
};

export function RequirementEditor({ node, onChange, onRemove }: RequirementEditorProps): JSX.Element {
  if (node.kind === "item") {
    return (
      <div className="flex items-center gap-2">
        <img src={itemIconUrl(node.item_id)} alt={node.name} className="h-6 w-6 object-contain" />
        <span className="flex-1 text-sm truncate">{node.name}</span>
        <Input
          type="number"
          min={1}
          value={node.quantity}
          onChange={(e) =>
            onChange({ ...node, quantity: Math.max(1, Number(e.target.value)) })
          }
          className="h-7 w-16 text-xs text-center"
        />
        {onRemove && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  if (node.kind === "text") {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={node.text}
          onChange={(e) => onChange({ ...node, text: e.target.value })}
          placeholder="Describe the requirement..."
          className="h-8 flex-1 text-sm"
        />
        {onRemove && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  const children = node.kind === "not" ? [node.child] : node.children;

  function replaceChild(index: number, next: RequirementNode): void {
    if (node.kind === "not") {
      onChange({ ...node, child: next });
      return;
    }
    if (node.kind === "item" || node.kind === "text") return;
    onChange({ ...node, children: node.children.map((c, i) => (i === index ? next : c)) });
  }

  function removeChild(index: number): void {
    if (node.kind === "not" || node.kind === "item" || node.kind === "text") return;
    onChange({ ...node, children: node.children.filter((_, i) => i !== index) });
  }

  function addChild(next: RequirementNode): void {
    if (node.kind === "not") {
      onChange({ ...node, child: next });
      return;
    }
    if (node.kind === "item" || node.kind === "text") return;
    onChange({ ...node, children: [...node.children, next] });
  }

  return (
    <div className="rounded-md border border-border/60 p-2 space-y-2">
      <div className="flex items-center gap-2">
        {node.kind !== "not" ? (
          <div className="flex gap-1">
            {(["and", "or"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ ...node, kind })}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  node.kind === kind
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {kind === "and" ? "All of these" : "Any one of"}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded border border-primary bg-primary/10 text-primary font-medium">
            Not
          </span>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <p className="pl-0.5 text-[11px] text-muted-foreground">
        {GROUP_HINT[node.kind]}
      </p>

      <div className="space-y-2 pl-2">
        {children.map((child, i) => (
          <RequirementEditor
            key={i}
            node={child}
            onChange={(next) => replaceChild(i, next)}
            onRemove={node.kind === "not" ? undefined : () => removeChild(i)}
          />
        ))}
      </div>

      {(node.kind !== "not" || children.length === 0) && (
        <div className="space-y-2 pl-2">
          <ItemSearch
            onSelect={(item) =>
              addChild({
                kind: "item",
                item_id: item.id,
                name: item.name,
                quantity: 1,
                icon_url: item.icon_url,
              })
            }
          />
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => addChild({ kind: "text", text: "" })}
            >
              + Text requirement
            </Button>
            {ADD_GROUPS.map((g) => (
              <Button
                key={g.label}
                type="button"
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => addChild(g.make())}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
