import { useCallback, useState } from "react";
import type { OsrsItem } from "@/types/osrsCache";
import { ItemHoverPreview } from "@/components/assets/ItemHoverPreview";
import { ItemIconCell } from "@/components/assets/ItemIconCell";
import { ItemRenderDialog } from "@/components/assets/ItemRenderDialog";
import { ItemVariantPopover, type VariantTarget } from "@/components/assets/ItemVariantPopover";
import { useHoverPreview } from "@/components/assets/useHoverPreview";
import { GRID_GAP, useVirtualLaneGrid } from "@/components/assets/useVirtualLaneGrid";

const CELL_HEIGHT = 80;

interface ItemIconGridProps {
  items: OsrsItem[];
  scrollElement: Element | null;
  copied: number | null;
  onCopy: (item: OsrsItem) => void;
  onDownload: (item: OsrsItem) => void;
  onSelectVariant: (item: OsrsItem) => void;
}

export function ItemIconGrid({
  items,
  scrollElement,
  copied,
  onCopy,
  onDownload,
  onSelectVariant,
}: ItemIconGridProps): React.JSX.Element {
  const { containerRef, virtualizer, itemWidth, scrollMargin, ready } = useVirtualLaneGrid(
    items.length,
    scrollElement,
  );
  const preview = useHoverPreview<OsrsItem>();
  const [renderTarget, setRenderTarget] = useState<OsrsItem | null>(null);
  const [variantTarget, setVariantTarget] = useState<VariantTarget | null>(null);

  const openRender = useCallback((item: OsrsItem) => setRenderTarget(item), []);
  const closeRender = useCallback(() => setRenderTarget(null), []);
  const closeVariants = useCallback(() => setVariantTarget(null), []);

  const openVariants = useCallback(
    (item: OsrsItem, left: number, top: number, width: number) =>
      setVariantTarget({ item, left, top, width, height: CELL_HEIGHT }),
    [],
  );

  const selectVariant = useCallback(
    (item: OsrsItem) => {
      setVariantTarget(null);
      onSelectVariant(item);
    },
    [onSelectVariant],
  );

  return (
    <div ref={containerRef} style={{ position: "relative", height: virtualizer.getTotalSize() }}>
      {ready &&
        virtualizer.getVirtualItems().map((vItem) => {
          const item = items[vItem.index];
          if (!item) return null;
          return (
            <ItemIconCell
              key={item.item_id}
              item={item}
              left={vItem.lane * (itemWidth + GRID_GAP)}
              width={itemWidth}
              translateY={vItem.start - scrollMargin}
              copied={copied === item.item_id}
              onCopy={onCopy}
              onDownload={onDownload}
              onOpenRender={openRender}
              onOpenVariants={openVariants}
              onHoverStart={preview.start}
              onHoverEnd={preview.end}
            />
          );
        })}

      {variantTarget && (
        <ItemVariantPopover
          target={variantTarget}
          onSelect={selectVariant}
          onClose={closeVariants}
        />
      )}
      {renderTarget && <ItemRenderDialog item={renderTarget} onClose={closeRender} />}
      {preview.target && <ItemHoverPreview item={preview.target} />}
    </div>
  );
}
