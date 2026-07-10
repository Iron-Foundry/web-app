import { useMemo } from "react";
import { parseBankTag } from "./bankTag";
import { ItemSlot } from "./ItemSlot";

export function BankTagDisplay({ raw }: { raw: string }) {
  const layout = useMemo(() => parseBankTag(raw), [raw]);

  if (!layout || layout.slots.length === 0) {
    return <p className="text-xs text-destructive">Invalid bank tag layout.</p>;
  }

  const maxPosition = layout.slots.reduce((max, slot) => Math.max(max, slot.position), 0);
  const cells: (number | null)[] = Array.from({ length: maxPosition + 1 }, () => null);
  for (const slot of layout.slots) cells[slot.position] = slot.itemId;

  return (
    <div className="grid grid-cols-8 gap-1 rounded-md border border-border bg-muted/30 p-1.5">
      {cells.map((itemId, index) => (
        <ItemSlot key={index} itemId={itemId} />
      ))}
    </div>
  );
}
