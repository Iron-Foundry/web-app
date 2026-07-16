import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { ItemSearch } from "./ItemSearch";
import { RequirementEditor } from "./RequirementEditor";
import { itemIconUrl } from "@/components/runelite/bankTag";
import type {
  AndRequirement,
  RequirementNode,
} from "@/types/tilerace";

interface RequirementBuilderProps {
  node: RequirementNode;
  onChange: (node: RequirementNode) => void;
}

function isSimpleAnd(node: RequirementNode): node is AndRequirement {
  return (
    node.kind === "and" &&
    node.children.every((c) => c.kind === "item" || c.kind === "text")
  );
}

export function RequirementBuilder({
  node,
  onChange,
}: RequirementBuilderProps): JSX.Element {
  const [advanced, setAdvanced] = useState(!isSimpleAnd(node));

  if (advanced || !isSimpleAnd(node)) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Advanced mode: combine <strong>All of</strong>, <strong>Any one of</strong>{" "}
          and <strong>Not</strong> groups to build any rule.
        </p>
        <RequirementEditor node={node} onChange={onChange} />
        {isSimpleAnd(node) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setAdvanced(false)}
          >
            <ChevronRight className="mr-1 h-3.5 w-3.5" />
            Back to simple list
          </Button>
        )}
      </div>
    );
  }

  const children = node.children;

  function update(next: RequirementNode[]): void {
    onChange({ kind: "and", children: next });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        The player needs <strong>all</strong> of the requirements listed below.
      </p>

      <div className="space-y-2 rounded-md border border-border/60 p-3">
        {children.length === 0 && (
          <p className="py-1 text-xs text-muted-foreground">
            No requirements yet. Add an item or a text requirement below.
          </p>
        )}

        {children.map((child, i) =>
          child.kind === "item" ? (
            <div key={i} className="flex items-center gap-2">
              <img
                src={itemIconUrl(child.item_id)}
                alt={child.name}
                className="h-6 w-6 object-contain"
              />
              <span className="flex-1 truncate text-sm">{child.name}</span>
              <label className="text-[10px] uppercase text-muted-foreground">Qty</label>
              <Input
                type="number"
                min={1}
                value={child.quantity}
                onChange={(e) =>
                  update(
                    children.map((c, j) =>
                      j === i
                        ? { ...child, quantity: Math.max(1, Number(e.target.value)) }
                        : c,
                    ),
                  )
                }
                className="h-7 w-16 text-center text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => update(children.filter((_, j) => j !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Text</span>
              <Input
                value={child.kind === "text" ? child.text : ""}
                onChange={(e) =>
                  update(
                    children.map((c, j) =>
                      j === i ? { kind: "text", text: e.target.value } : c,
                    ),
                  )
                }
                placeholder="Requirement with no linked item, e.g. Complete Barrows chest"
                className="h-8 flex-1 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => update(children.filter((_, j) => j !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        )}

        <ItemSearch
          placeholder="Add an item (search OSRS items)..."
          onSelect={(item) =>
            update([
              ...children,
              {
                kind: "item",
                item_id: item.id,
                name: item.name,
                quantity: 1,
                icon_url: item.icon_url,
              },
            ])
          }
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => update([...children, { kind: "text", text: "" }])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add text requirement
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground"
        onClick={() => setAdvanced(true)}
      >
        <ChevronDown className="mr-1 h-3.5 w-3.5" />
        Advanced logic (any-of / not / groups)
      </Button>
    </div>
  );
}
