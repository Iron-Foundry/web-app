import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapTilesApi, tileEventsUrl } from "@/api/mapTiles";
import { cn } from "@/lib/utils";

const ZOOM_LEVELS = [4, 5, 6, 7, 8, 9, 10, 11] as const;
const CANVAS_TARGET_PX = 448;

function pxPerTile(cols: number): number {
  return Math.max(1, Math.min(16, Math.floor(CANVAS_TARGET_PX / cols)));
}

interface Props {
  plane?: number;
  className?: string;
}

interface TileFetchedEvent {
  type: "tile_fetched";
  z: number;
  x: number;
  y: number;
}

export function TileCoverageMap({ plane = 0, className }: Props): JSX.Element {
  const [selectedZ, setSelectedZ] = useState<number>(6);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [liveFetched, setLiveFetched] = useState<Set<string>>(new Set());

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["map-tiles", "coverage", plane, selectedZ],
    queryFn: () => mapTilesApi.getCoverage(plane, selectedZ),
    staleTime: 30_000,
  });

  useEffect(() => {
    const es = new EventSource(tileEventsUrl());
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const event = JSON.parse(e.data) as Record<string, unknown>;
        if (event.type === "tile_fetched") {
          const ev = event as unknown as TileFetchedEvent;
          if (ev.z === selectedZ) {
            setLiveFetched((prev) => {
              const next = new Set(prev);
              next.add(`${ev.x},${ev.y}`);
              return next;
            });
          }
        }
      } catch {
        // malformed SSE data - ignore
      }
    };
    return () => es.close();
  }, [selectedZ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ppt = pxPerTile(data.cols);
    canvas.width = data.cols * ppt;
    canvas.height = data.rows * ppt;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [x, y, hasContent] of data.tiles) {
      ctx.fillStyle = hasContent ? "rgba(34,197,94,0.7)" : "rgba(55,65,81,0.45)";
      ctx.fillRect(x * ppt, y * ppt, ppt, ppt);
    }

    for (const key of liveFetched) {
      const parts = key.split(",");
      const lx = Number(parts[0]);
      const ly = Number(parts[1]);
      ctx.fillStyle = "rgba(34,211,238,0.9)";
      ctx.fillRect(lx * ppt, ly * ppt, ppt, ppt);
    }
  }, [data, liveFetched]);

  const cachedCount = data?.tiles.length ?? 0;
  const totalCells = data ? data.cols * data.rows : 0;
  const coveragePct = totalCells > 0 ? ((cachedCount / totalCells) * 100).toFixed(1) : "0";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm">Coverage Map</CardTitle>
          <div className="flex items-center gap-1 flex-wrap">
            {ZOOM_LEVELS.map((z) => (
              <Button
                key={z}
                variant={selectedZ === z ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-xs px-1.5"
                onClick={() => {
                  setSelectedZ(z);
                  setLiveFetched(new Set());
                }}
              >
                z{z}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? "..." : "Refresh"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {cachedCount.toLocaleString()} / {totalCells.toLocaleString()} tiles ({coveragePct}%)
          {liveFetched.size > 0 && (
            <span className={cn("ml-2 text-cyan-500")}>
              +{liveFetched.size} live
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="flex justify-center overflow-auto">
        {!data && isFetching ? (
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
        ) : (
          <canvas
            ref={canvasRef}
            className="border border-border rounded"
            style={{ imageRendering: "pixelated", maxWidth: "100%" }}
          />
        )}
      </CardContent>
    </Card>
  );
}
