import { useEffect, useState } from "react";
import { osrsCacheApi } from "@/api/osrsCache";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { OsrsItem } from "@/types/osrsCache";
import { ItemHoverPreview } from "@/components/assets/ItemHoverPreview";
import { ItemVariantRow } from "@/components/assets/ItemVariantRow";
import { useHoverPreview } from "@/components/assets/useHoverPreview";

export interface VariantTarget {
  item: OsrsItem;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ItemVariantPopoverProps {
  target: VariantTarget;
  onSelect: (item: OsrsItem) => void;
  onClose: () => void;
}

export function ItemVariantPopover({
  target,
  onSelect,
  onClose,
}: ItemVariantPopoverProps): React.JSX.Element {
  const { item, left, top, width, height } = target;
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<OsrsItem[]>([]);
  const preview = useHoverPreview<OsrsItem>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    osrsCacheApi
      .getItemVariants(item.item_id)
      .then((data) => {
        if (active) setVariants(data);
      })
      .catch(() => {
        if (active) setVariants([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [item.item_id]);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.currentTarget.scrollTop += e.deltaY;
  }

  function handleSelect(variant: OsrsItem) {
    preview.end();
    onSelect(variant);
  }

  return (
    <Popover open onOpenChange={(next) => !next && onClose()}>
      <PopoverAnchor asChild>
        <div className="absolute pointer-events-none" style={{ left, top, width, height }} />
      </PopoverAnchor>
      <PopoverContent
        className="w-72 p-2"
        side="bottom"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-rs-bold text-muted-foreground mb-1 px-1">Variants</p>
        {loading ? (
          <p className="text-xs text-muted-foreground px-1 py-2">Loading…</p>
        ) : (
          <div
            className="max-h-72 overflow-y-auto overscroll-contain space-y-0.5"
            onWheel={handleWheel}
          >
            {variants.map((variant) => (
              <ItemVariantRow
                key={variant.item_id}
                variant={variant}
                active={variant.item_id === item.item_id}
                onSelect={handleSelect}
                onHoverStart={preview.start}
                onHoverEnd={preview.end}
              />
            ))}
          </div>
        )}
      </PopoverContent>
      {preview.target && <ItemHoverPreview item={preview.target} />}
    </Popover>
  );
}
