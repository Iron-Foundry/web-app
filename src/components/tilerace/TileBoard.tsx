import { useMemo } from "react";
import type { BoardCell, TileRaceEvent, TileRaceTeam } from "@/types/tilerace";
import {
  buildCellMap,
  buildFogMask,
  buildPathPositionMap,
  buildTeamsByCell,
  getEffectiveTileIcon,
  isCellVisible,
} from "@/lib/tilerace";
import { TeamMarker } from "./TeamMarker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TileBoardProps {
  event: TileRaceEvent;
  onCellClick?: (cell: BoardCell) => void;
}

interface CellProps {
  cell: BoardCell | undefined;
  teams: TileRaceTeam[];
  visible: boolean;
  onCellClick?: (cell: BoardCell) => void;
}

function BoardCellContent({ cell, teams, visible, onCellClick }: CellProps): JSX.Element {
  const isOnPath = cell?.path_position !== null && cell?.path_position !== undefined;
  const tile = cell?.tile ?? null;
  const iconUrl = tile ? getEffectiveTileIcon(tile) : null;

  if (!isOnPath) {
    return <div className="w-full h-full" />;
  }

  const hidden = !visible;
  const hasTooltip = !hidden && tile && (tile.description || tile.items.length > 0);

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
      {!hidden && (
        <>
          <span className="absolute top-0.5 left-1 text-[8px] text-muted-foreground leading-none">
            {cell?.path_position}
          </span>
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
        {tile!.items.length > 0 && (
          <ul className="space-y-1 pt-0.5">
            {tile!.items.map((item) => (
              <li key={item.item_id} className="flex items-center gap-1.5">
                <img src={item.icon_url} alt={item.name} className="h-4 w-4 object-contain shrink-0" />
                <span className="text-xs truncate">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-auto">×{item.quantity}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function TileBoard({ event, onCellClick }: TileBoardProps): JSX.Element {
  const { cells, teams, grid_cols, grid_rows, fog_of_war, background_url } = event;

  const cellMap = useMemo(() => buildCellMap(cells), [cells]);
  const pathPositionMap = useMemo(() => buildPathPositionMap(cells), [cells]);
  const teamsByCell = useMemo(
    () => buildTeamsByCell(teams, pathPositionMap),
    [teams, pathPositionMap],
  );
  const fogMax = useMemo(() => buildFogMask(teams), [teams]);

  return (
    <TooltipProvider>
      <div
        className="relative w-full overflow-hidden rounded-lg border bg-muted"
        style={{
          aspectRatio: "18/9",
          backgroundImage: background_url ? `url(${background_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 grid gap-0.5 p-1"
          style={{
            gridTemplateColumns: `repeat(${grid_cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid_rows}, 1fr)`,
          }}
        >
          {Array.from({ length: grid_rows }, (_, y) =>
            Array.from({ length: grid_cols }, (_, x) => {
              const key = `${x},${y}`;
              const cell = cellMap.get(key);
              const teamsHere = teamsByCell.get(key) ?? [];
              const visible = cell
                ? isCellVisible(cell, fogMax, fog_of_war)
                : true;

              return (
                <div
                  key={key}
                  style={{ gridColumn: x + 1, gridRow: y + 1 }}
                  className="relative min-w-0"
                >
                  <BoardCellContent
                    cell={cell}
                    teams={teamsHere}
                    visible={visible}
                    onCellClick={onCellClick}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
