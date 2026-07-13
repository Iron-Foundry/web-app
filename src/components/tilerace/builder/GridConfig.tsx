import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AssetPickerDialog } from "@/components/content/AssetPickerDialog";
import { usePatchTileraceEvent } from "@/hooks/useTilerace";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import type { TileRaceEventSummary } from "@/types/tilerace";

interface GridConfigProps {
  event: TileRaceEventSummary;
}

export function GridConfig({ event }: GridConfigProps): JSX.Element {
  const [cols, setCols] = useState(String(event.grid_cols));
  const [rows, setRows] = useState(String(event.grid_rows));
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const { mutate: patchEvent, isPending } = usePatchTileraceEvent();

  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const canUpload = hasPermission("staff.assets", "create", effectiveRoles);
  const canDeleteAny = hasPermission("staff.assets", "delete", effectiveRoles);

  function handleApplyGrid() {
    const gridCols = Math.min(50, Math.max(2, Number(cols)));
    const gridRows = Math.min(30, Math.max(2, Number(rows)));
    patchEvent({ id: event.id, data: { grid_cols: gridCols, grid_rows: gridRows } });
  }

  function handleAssetSelect(url: string) {
    patchEvent({ id: event.id, data: { background_url: url } });
    setAssetPickerOpen(false);
  }

  function handleClearBackground() {
    patchEvent({
      id: event.id,
      data: { background_url: null, background_asset_id: null },
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <p className="text-sm font-semibold">Grid Settings</p>

        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Columns</Label>
            <Input
              type="number"
              min={2}
              max={50}
              value={cols}
              onChange={(e) => setCols(e.target.value)}
              className="h-8 w-20 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rows</Label>
            <Input
              type="number"
              min={2}
              max={30}
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="h-8 w-20 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleApplyGrid} disabled={isPending}>
            Apply
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Background (18:9)</Label>
          <div className="flex items-center gap-2">
            {event.background_url && (
              <img
                src={event.background_url}
                alt="Board background"
                className="h-12 rounded border object-cover"
                style={{ aspectRatio: "18/9" }}
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssetPickerOpen(true)}
            >
              {event.background_url ? "Change" : "Select"} Background
            </Button>
            {event.background_url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearBackground}
                disabled={isPending}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <AssetPickerDialog
        open={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={(url) => handleAssetSelect(url)}
        canUpload={canUpload}
        canDeleteAny={canDeleteAny}
      />
    </Card>
  );
}
