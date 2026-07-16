import type { OsrsSprite } from "@/types/osrsCache";
import { SpriteCell } from "@/components/assets/SpriteCell";
import { SpriteHoverPreview } from "@/components/assets/SpriteHoverPreview";
import { useHoverPreview } from "@/components/assets/useHoverPreview";
import { GRID_GAP, useVirtualLaneGrid } from "@/components/assets/useVirtualLaneGrid";

interface SpriteGridProps {
  sprites: OsrsSprite[];
  scrollElement: Element | null;
  copied: number | null;
  onCopy: (sprite: OsrsSprite) => void;
  onDownload: (sprite: OsrsSprite) => void;
}

export function SpriteGrid({
  sprites,
  scrollElement,
  copied,
  onCopy,
  onDownload,
}: SpriteGridProps): React.JSX.Element {
  const { containerRef, virtualizer, itemWidth, scrollMargin, ready } = useVirtualLaneGrid(
    sprites.length,
    scrollElement,
  );
  const preview = useHoverPreview<OsrsSprite>();

  return (
    <div ref={containerRef} style={{ position: "relative", height: virtualizer.getTotalSize() }}>
      {ready &&
        virtualizer.getVirtualItems().map((vItem) => {
          const sprite = sprites[vItem.index];
          if (!sprite) return null;
          return (
            <SpriteCell
              key={`${sprite.sprite_id}-${sprite.frame_index}`}
              sprite={sprite}
              left={vItem.lane * (itemWidth + GRID_GAP)}
              width={itemWidth}
              translateY={vItem.start - scrollMargin}
              copied={copied === sprite.sprite_id}
              onCopy={onCopy}
              onDownload={onDownload}
              onHoverStart={preview.start}
              onHoverEnd={preview.end}
            />
          );
        })}

      {preview.target && <SpriteHoverPreview sprite={preview.target} />}
    </div>
  );
}
