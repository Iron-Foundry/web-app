import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { itemIconUrl } from "@/components/runelite/bankTag";
import { usePatchTileraceTeam } from "@/hooks/useTilerace";
import { OsrsIconSearch } from "./OsrsIconSearch";
import type { TileRaceTeam } from "@/types/tilerace";

interface Props {
  eventId: string;
  team: TileRaceTeam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discordProvisioned: boolean;
}

/**
 * Rename a team and pick its icon.
 *
 * Item icons come from the cache service by id; NPC art comes from the wiki,
 * which is the one place the cache cannot render.
 */
export function TeamIdentityDialog({
  eventId,
  team,
  open,
  onOpenChange,
  discordProvisioned,
}: Props): JSX.Element {
  const { mutate: patchTeam, isPending } = usePatchTileraceTeam();
  const [name, setName] = useState(team.name);
  const [iconType, setIconType] = useState<"item" | "npc">(team.icon_type);
  const [iconUrl, setIconUrl] = useState(team.icon_url);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(team.name);
    setIconType(team.icon_type);
    setIconUrl(team.icon_url);
    setError(null);
  }, [open, team.name, team.icon_type, team.icon_url]);

  const trimmed = name.trim();
  const dirty =
    trimmed !== team.name ||
    iconType !== team.icon_type ||
    iconUrl !== team.icon_url;

  function save(): void {
    if (!trimmed) {
      setError("A team needs a name.");
      return;
    }
    patchTeam(
      {
        eventId,
        teamId: team.id,
        data: { name: trimmed, icon_type: iconType, icon_url: iconUrl },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e: Error) => setError(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>
            {discordProvisioned
              ? "Renaming also renames this team's Discord role and its two channels."
              : "Set the name and icon shown on the board and the public page."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="team-name">
              Name
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Icon</Label>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded border flex items-center justify-center">
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={trimmed || "Team icon"}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground">none</span>
                )}
              </div>
              {iconUrl && (
                <Button size="sm" variant="ghost" onClick={() => setIconUrl("")}>
                  Clear
                </Button>
              )}
            </div>
            <OsrsIconSearch
              kind={iconType}
              onKindChange={setIconType}
              onPick={(result) =>
                setIconUrl(
                  iconType === "item" ? itemIconUrl(result.id) : result.icon_url,
                )
              }
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!dirty || isPending || !trimmed}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
