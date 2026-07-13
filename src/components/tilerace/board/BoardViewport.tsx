import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import { useZoomPan } from "@/hooks/useZoomPan";

interface BoardViewportProps {
  backgroundUrl?: string;
  leftButtonPans?: boolean;
  children: React.ReactNode;
}

export function BoardViewport({
  backgroundUrl,
  leftButtonPans = true,
  children,
}: BoardViewportProps): JSX.Element {
  const { transform, reset, onWheel, onPointerDown, onPointerMove, onPointerUp } =
    useZoomPan({ leftButtonPans });

  return (
    <div className="relative w-full">
      <div
        className="relative w-full overflow-hidden rounded-lg border bg-muted touch-none"
        style={{ aspectRatio: "18/9" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={leftButtonPans ? undefined : (e) => e.preventDefault()}
      >
        <div
          className="absolute inset-0 origin-top-left cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {children}
        </div>
      </div>
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-2 right-2 h-7 w-7"
        onClick={reset}
        title="Fit to screen"
      >
        <Maximize className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
