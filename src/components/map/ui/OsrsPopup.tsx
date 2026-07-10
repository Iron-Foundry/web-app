import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMapContext } from "../core/MapContext";
import type { OsrsCoord } from "../core/types";

interface OsrsPopupProps {
  coord: OsrsCoord;
  label: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Themed popup card anchored to an OSRS coordinate.
 * Positioned via MapContext - must be inside OsrsMap.
 */
export function OsrsPopup({
  coord,
  label,
  description,
  onClose,
  className,
}: OsrsPopupProps) {
  const { osrsToScreen } = useMapContext();
  const { x, y } = osrsToScreen(coord);

  return (
    <div
      className={cn(
        "absolute z-20 pointer-events-auto",
        "min-w-40 max-w-64 -translate-x-1/2 -translate-y-full mb-2",
        className
      )}
      style={{ left: x, top: y - 8 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="rounded-md border border-primary/40 bg-popover shadow-lg shadow-black/40">
        <div className="flex items-start justify-between gap-2 px-3 pt-2 pb-1">
          <span className="font-rs-bold text-sm text-primary leading-tight">
            {label}
          </span>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {description && (
          <p className="px-3 pb-2 text-xs text-muted-foreground">{description}</p>
        )}
        <div
          className="mx-auto w-2 h-2 rotate-45 border-r border-b border-primary/40 bg-popover -mt-1 mb-0"
          style={{ width: 8, height: 8 }}
        />
      </div>
    </div>
  );
}
