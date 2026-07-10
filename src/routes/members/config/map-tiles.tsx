import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { RefreshCw, Play, Square, Trash2, MapPin } from "lucide-react";
import { membersLayoutRoute } from "../_layout";
import { StaffGuard } from "@/components/StaffGuard";
import { registerPage } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { mapTilesApi } from "@/api/mapTiles";
import { TileCoverageMap } from "@/components/map-tiles/TileCoverageMap";
import { TileEventFeed } from "@/components/map-tiles/TileEventFeed";
import { cn } from "@/lib/utils";

registerPage({
  id: "staff.map_tiles",
  label: "Map Tiles",
  description: "Manage the OSRS map tile cache - sync, invalidate, and delete tiles.",
  defaults: {
    read: ["Foundry Mentors"],
    create: ["Foundry Mentors"],
    edit: ["Foundry Mentors"],
    delete: ["Senior Moderator"],
  },
});

export const mapTilesConfigRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/config/map-tiles",
  component: () => (
    <StaffGuard pageId="staff.map_tiles">
      <MapTilesPage />
    </StaffGuard>
  ),
});

function MapTilesPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [force, setForce] = useState(false);
  const [regionId, setRegionId] = useState("");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: status, isFetching: statusFetching } = useQuery({
    queryKey: ["map-tiles", "sync-status"],
    queryFn: mapTilesApi.getSyncStatus,
    refetchInterval: (query) => (query.state.data?.running ? 3000 : 15000),
  });

  const invalidateStatus = (): void => {
    void queryClient.invalidateQueries({ queryKey: ["map-tiles", "sync-status"] });
  };

  const onError = (e: Error): void => setMutationError(e.message);
  const clearError = (): void => setMutationError(null);

  const startSync = useMutation({
    mutationFn: () => mapTilesApi.startSync(force),
    onSuccess: () => { clearError(); invalidateStatus(); },
    onError,
  });

  const stopSync = useMutation({
    mutationFn: mapTilesApi.stopSync,
    onSuccess: () => { clearError(); invalidateStatus(); },
    onError,
  });

  const deleteAll = useMutation({
    mutationFn: mapTilesApi.deleteAllTiles,
    onSuccess: () => { clearError(); setConfirmDeleteAll(false); invalidateStatus(); },
    onError,
  });

  const deleteRegion = useMutation({
    mutationFn: () => mapTilesApi.deleteRegion(parseInt(regionId, 10)),
    onSuccess: () => { clearError(); setRegionId(""); invalidateStatus(); },
    onError,
  });

  const regionIdNum = parseInt(regionId, 10);
  const regionIdValid = regionId !== "" && !Number.isNaN(regionIdNum) && regionIdNum >= 0 && regionIdNum <= 65535;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Map Tile Repository</h1>
        <p className="text-sm text-muted-foreground">
          OSRS map tiles cached from Explv's repository. Tiles are lazy-fetched on demand and can be bulk-synced here.
        </p>
      </div>

      {mutationError && (
        <p className="text-sm text-destructive">{mutationError}</p>
      )}

      <TileCoverageMap plane={0} />
      <TileEventFeed />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Cache Status</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={invalidateStatus}
              disabled={statusFetching}
            >
              <RefreshCw className={cn("h-3 w-3", statusFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-2.5 w-2.5 rounded-full shrink-0",
              status?.running ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40",
            )} />
            <span className="text-sm font-medium">
              {status?.running ? "Sync in progress" : "Idle"}
            </span>
            {status?.running && (
              <Badge variant="outline" className="text-xs">running</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Cached tiles:</span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {status !== undefined ? status.cached.toLocaleString() : "-"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sync Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Force re-download existing tiles
          </label>
          <p className="text-xs text-muted-foreground">
            Without force, cached tiles are skipped. Enable to re-download everything - use after an OSRS map update.
            Syncs run at a rate-limited pace (8 concurrent, 100ms delay) to avoid GitHub CDN limits.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => startSync.mutate()}
              disabled={status?.running || startSync.isPending}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {status?.running ? "Sync Running" : "Start Sync"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => stopSync.mutate()}
              disabled={!status?.running || stopSync.isPending}
              className="gap-1.5"
            >
              <Square className="h-3.5 w-3.5" />
              Stop Sync
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            To run sync automatically on startup, set <code className="font-mono bg-muted px-1 rounded">TILE_SYNC_ON_STARTUP=true</code> in the environment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Region Invalidation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Delete cached tiles for a specific OSRS region. Tiles will be re-fetched lazily on next map load.
            Region ID formula: <code className="font-mono bg-muted px-1 rounded">{"((x // 64) << 8) | (y // 64)"}</code>
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={65535}
              placeholder="Region ID (0-65535)"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-52 text-sm font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteRegion.mutate()}
              disabled={!regionIdValid || deleteRegion.isPending}
            >
              {deleteRegion.isPending ? "Deleting..." : "Delete Region"}
            </Button>
          </div>
          {deleteRegion.isSuccess && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Region tiles removed. They will be re-fetched on next access.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Danger Zone</h2>
        <Card className="border-destructive/40">
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Delete All Tiles</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Wipes the entire tile cache ({status !== undefined ? status.cached.toLocaleString() : "all"} tiles).
                Use when OSRS releases a map update. Tiles are re-fetched lazily after deletion.
              </p>
            </div>
            {!confirmDeleteAll ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmDeleteAll(true)}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All Tiles
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAll.mutate()}
                  disabled={deleteAll.isPending}
                >
                  {deleteAll.isPending ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDeleteAll(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
