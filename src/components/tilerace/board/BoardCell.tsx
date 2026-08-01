import type { BoardCell as BoardCellType, TileRacePublicTeam } from "@/types/tilerace";
import { getCellPresentation } from "@/lib/tilerace-presentation";
import { RequirementSummary } from "../RequirementSummary";
import { ModifierBadge } from "./ModifierBadge";
import { TeamMarker } from "../TeamMarker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BoardCellProps {
  cell: BoardCellType | undefined;
  teams: TileRacePublicTeam[];
  visible: boolean;
  onCellClick?: (cell: BoardCellType) => void;
  rollingTeamIds?: Set<string>;
}

export function BoardCell({
  cell,
  teams,
  visible,
  onCellClick,
  rollingTeamIds,
}: BoardCellProps): JSX.Element {
  const isOnPath = cell?.path_position !== null && cell?.path_position !== undefined;
  const { source, iconUrl, title, description, requirement } = getCellPresentation(cell);

  if (!isOnPath) {
    return <div className="w-full h-full" />;
  }

  const hidden = !visible;
  const modifiers = (cell?.modifiers ?? []).filter(
    (mod) => !(source === "trap" && mod.type === "trap"),
  );
  const hasTileInfo = !!description || !!requirement;
  const hasTooltip = !hidden && (hasTileInfo || teams.length > 0);

  const cellEl = (
    <div
      onClick={() => cell && onCellClick?.(cell)}
      className={`relative w-full h-full flex flex-col items-center justify-center rounded-sm border transition-all ${
        onCellClick ? "cursor-pointer" : ""
      } ${
        hidden
          ? "bg-black/60 border-white/10"
          : "bg-card/80 border-white/20 hover:border-white/40"
      }`}
    >
      {hidden ? (
        <span className="font-rs-bold text-white text-lg text-shadow-fog leading-none">
          ?
        </span>
      ) : (
        <>
          <span className="absolute top-0.5 left-1 text-[8px] text-muted-foreground leading-none">
            {cell?.path_position}
          </span>
          {modifiers.length > 0 && (
            <span className="absolute top-0.5 right-0.5 flex gap-0.5">
              {modifiers.map((mod, i) => (
                <ModifierBadge key={i} modifier={mod} />
              ))}
            </span>
          )}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={title ?? ""}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="h-2/5 aspect-square rounded-full bg-primary/30" />
            )}
          </div>
          {title && (
            <p className="hidden sm:block shrink-0 text-[7px] text-center text-foreground/70 leading-tight px-0.5 pb-0.5 line-clamp-2 max-w-full">
              {title}
            </p>
          )}
        </>
      )}

      {teams.length > 0 && !hidden && (
        <div className="absolute bottom-0.5 left-0 right-0 flex items-center justify-center pointer-events-none">
          {teams.map((team, i) => (
            <TeamMarker
              key={team.id}
              team={team}
              index={i}
              total={teams.length}
              isRolling={rollingTeamIds?.has(team.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (!hasTooltip) return cellEl;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{cellEl}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-52 space-y-1.5 p-3">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {requirement && <RequirementSummary node={requirement} />}
        {teams.length > 0 && (
          <div className={hasTileInfo ? "pt-1 border-t space-y-1" : "space-y-1"}>
            {teams.map((team) => (
              <div key={team.id} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0 border border-white/50"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-xs font-medium">{team.name}</span>
                <span className="text-xs text-muted-foreground">
                  Step {team.position}
                </span>
              </div>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
