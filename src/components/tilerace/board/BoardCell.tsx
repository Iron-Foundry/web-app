import type { BoardCell as BoardCellType, TileRaceTeam } from "@/types/tilerace";
import { getEffectiveTileIcon } from "@/lib/tilerace";
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
  teams: TileRaceTeam[];
  visible: boolean;
  onCellClick?: (cell: BoardCellType) => void;
}

export function BoardCell({
  cell,
  teams,
  visible,
  onCellClick,
}: BoardCellProps): JSX.Element {
  const isOnPath = cell?.path_position !== null && cell?.path_position !== undefined;
  const tile = cell?.tile ?? null;
  const iconUrl = tile ? getEffectiveTileIcon(tile) : null;

  if (!isOnPath) {
    return <div className="w-full h-full" />;
  }

  const hidden = !visible;
  const modifiers = cell?.modifiers ?? [];
  const hasTooltip = !hidden && tile && (tile.description || !!tile.requirement);

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
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={tile?.title ?? ""}
              className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
            />
          ) : (
            <div className="h-3 w-3 rounded-full bg-primary/30" />
          )}
          {tile && (
            <p className="hidden sm:block text-[7px] text-center text-foreground/70 leading-tight px-0.5 mt-0.5 line-clamp-2 max-w-full">
              {tile.title}
            </p>
          )}
        </>
      )}

      {teams.length > 0 && !hidden && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {teams.map((team, i) => (
            <TeamMarker key={team.id} team={team} index={i} total={teams.length} />
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
        <p className="font-semibold text-sm">{tile!.title}</p>
        {tile!.description && (
          <p className="text-xs text-muted-foreground">{tile!.description}</p>
        )}
        {tile!.requirement && <RequirementSummary node={tile!.requirement} />}
      </TooltipContent>
    </Tooltip>
  );
}
