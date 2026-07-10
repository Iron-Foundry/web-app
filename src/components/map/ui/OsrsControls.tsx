import { Plus, Minus, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapContext } from "../core/MapContext";

export function OsrsControls() {
  const { zoomIn, zoomOut, recenter } = useMapContext();

  const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-1 pointer-events-auto z-10">
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 shadow-md"
        onPointerDown={stop}
        onClick={(e) => { stop(e); zoomIn(); }}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 shadow-md"
        onPointerDown={stop}
        onClick={(e) => { stop(e); zoomOut(); }}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 shadow-md"
        onPointerDown={stop}
        onClick={(e) => { stop(e); recenter(); }}
        aria-label="Re-center"
      >
        <LocateFixed className="h-4 w-4" />
      </Button>
    </div>
  );
}
