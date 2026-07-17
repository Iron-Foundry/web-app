import { useCallback, useState } from "react";
import type { OsrsSprite } from "@/types/osrsCache";
import { SpriteCell } from "@/components/assets/SpriteCell";
import { SpriteHoverPreview } from "@/components/assets/SpriteHoverPreview";
import { SpriteRenderDialog } from "@/components/assets/SpriteRenderDialog";
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
  const [renderTarget, setRenderTarget] = useState<OsrsSprite | null>(null);

  const openRender = useCallback((sprite: OsrsSprite) => setRenderTarget(sprite), []);
  const closeRender = useCallback(() => setRenderTarget(null), []);

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
              onOpenRender={openRender}
              onHoverStart={preview.start}
              onHoverEnd={preview.end}
            />
          );
        })}

      {renderTarget && <SpriteRenderDialog sprite={renderTarget} onClose={closeRender} />}
      {preview.target && <SpriteHoverPreview sprite={preview.target} />}
    </div>
  );
}
