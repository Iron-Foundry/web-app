import { useMemo } from "react";
import type { BoardCell as BoardCellType, TileRaceEvent } from "@/types/tilerace";
import {
  buildCellMap,
  buildFogMask,
  buildPathPositionMap,
  buildTeamsByCell,
  isCellVisible,
} from "@/lib/tilerace";
import { BoardCell } from "./board/BoardCell";
import { BoardPads } from "./board/BoardPads";
import { BoardViewport } from "./board/BoardViewport";
import { TooltipProvider } from "@/components/ui/tooltip";

interface TileBoardProps {
  event: TileRaceEvent;
  onCellClick?: (cell: BoardCellType) => void;
}

export function TileBoard({ event, onCellClick }: TileBoardProps): JSX.Element {
  const {
    cells,
    teams,
    grid_cols,
    grid_rows,
    fog_of_war,
    background_url,
    start_pad,
    end_pad,
  } = event;

  const cellMap = useMemo(() => buildCellMap(cells), [cells]);
  const pathPositionMap = useMemo(() => buildPathPositionMap(cells), [cells]);
  const teamsByCell = useMemo(
    () => buildTeamsByCell(teams, pathPositionMap),
    [teams, pathPositionMap],
  );
  const fogMax = useMemo(() => buildFogMask(teams), [teams]);

  return (
    <TooltipProvider>
      <BoardViewport backgroundUrl={background_url}>
        <div
          className="absolute inset-0 grid gap-0.5 p-2 sm:p-3"
          style={{
            gridTemplateColumns: `repeat(${grid_cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid_rows}, minmax(0, 1fr))`,
          }}
        >
          <BoardPads startPad={start_pad} endPad={end_pad} />
          {Array.from({ length: grid_rows }, (_, y) =>
            Array.from({ length: grid_cols }, (_, x) => {
              const key = `${x},${y}`;
              const cell = cellMap.get(key);
              const teamsHere = teamsByCell.get(key) ?? [];
              const visible = cell ? isCellVisible(cell, fogMax, fog_of_war) : true;

              return (
                <div
                  key={key}
                  style={{ gridColumn: x + 1, gridRow: y + 1 }}
                  className="relative min-w-0 min-h-0 overflow-hidden"
                >
                  <BoardCell
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
      </BoardViewport>
    </TooltipProvider>
  );
}
