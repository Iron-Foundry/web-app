import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tileEventsUrl } from "@/api/mapTiles";
import { cn } from "@/lib/utils";

interface TileEvent {
  id: number;
  type: string;
  ts: number;
  data: Record<string, unknown>;
}

const MAX_EVENTS = 80;

function badgeVariant(type: string): "default" | "secondary" | "outline" {
  if (type === "sync_started" || type === "sync_complete" || type === "sync_stopped") {
    return "default";
  }
  if (type === "sync_progress") return "secondary";
  return "outline";
}

function formatEvent(e: TileEvent): string {
  const d = e.data;
  switch (e.type) {
    case "sync_started":
      return `Sync started - ${String(d.total ?? "?")} tiles planned`;
    case "sync_progress": {
      const pct =
        d.total && (d.total as number) > 0
          ? (((d.processed as number) / (d.total as number)) * 100).toFixed(1)
          : "?";
      return `${String(d.processed ?? 0)} / ${String(d.total ?? "?")} (${pct}%) @ z${String(d.current_zoom)} - ${String(d.rate_per_sec ?? 0)}/s`;
    }
    case "sync_complete":
      return `Sync complete - ${String(d.processed ?? "?")} tiles processed`;
    case "sync_stopped":
      return `Sync stopped at ${String(d.processed ?? "?")} tiles`;
    case "tile_fetched":
      return `plane=${String(d.plane)} z=${String(d.z)} (${String(d.x)},${String(d.y)}) [${String(d.source)}]`;
    default:
      return JSON.stringify(d);
  }
}

export function TileEventFeed(): JSX.Element {
  const [events, setEvents] = useState<TileEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const counterRef = useRef(0);

  useEffect(() => {
    const es = new EventSource(tileEventsUrl());

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const raw = JSON.parse(e.data) as Record<string, unknown>;
        const event: TileEvent = {
          id: ++counterRef.current,
          type: String(raw.type ?? "unknown"),
          ts: Date.now(),
          data: raw,
        };
        setEvents((prev) => {
          const next = [event, ...prev];
          return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
        });
      } catch {
        // malformed SSE data - ignore
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Live Event Feed</CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {connected ? "connected" : "disconnected"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Waiting for events... Start a sync or load map tiles to see activity.
          </p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground shrink-0 tabular-nums font-mono">
                  {new Date(e.ts).toLocaleTimeString()}
                </span>
                <Badge
                  variant={badgeVariant(e.type)}
                  className="text-[10px] py-0 px-1 shrink-0"
                >
                  {e.type}
                </Badge>
                <span className="text-muted-foreground break-all">{formatEvent(e)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
