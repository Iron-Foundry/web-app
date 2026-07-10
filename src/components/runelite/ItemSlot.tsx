import { itemIconUrl } from "./bankTag";
import { useItemNames } from "@/hooks/useItemNames";

function formatQuantity(quantity: number): string {
  if (quantity >= 10_000_000) return `${Math.floor(quantity / 1_000_000)}M`;
  if (quantity >= 100_000) return `${Math.floor(quantity / 1000)}K`;
  return String(quantity);
}

interface ItemSlotProps {
  itemId?: number | null;
  quantity?: number;
  empty?: boolean;
}

export function ItemSlot({ itemId, quantity, empty = false }: ItemSlotProps) {
  const { data: names } = useItemNames();
  if (empty) return <div className="aspect-square" />;
  const filled = itemId != null && itemId > 0;
  const label = filled ? (names?.get(itemId) ?? String(itemId)) : undefined;
  return (
    <div className="relative flex aspect-square items-center justify-center rounded-sm border border-border/60 bg-background/60">
      {filled && (
        <>
          <img
            src={itemIconUrl(itemId)}
            alt={label}
            title={label}
            loading="lazy"
            className="relative max-h-full max-w-full object-contain [filter:var(--item-glow,drop-shadow(0_0_1.5px_rgba(150,190,230,0.55)))]"
          />
          {quantity != null && quantity > 1 && (
            <span className="absolute left-0 top-0 z-10 px-0.5 text-[8px] leading-none text-yellow-300 [text-shadow:0_0_2px_#000]">
              {formatQuantity(quantity)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
