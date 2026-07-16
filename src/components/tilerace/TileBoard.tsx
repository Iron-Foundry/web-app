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
  rollingTeamIds?: Set<string>;
}

export function TileBoard({
  event,
  onCellClick,
  rollingTeamIds,
}: TileBoardProps): JSX.Element {
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
  const fogMax = useMemo(() => buildFogMask(teams), [teams]);
  const maxPathPosition = useMemo(() => {
    const positions = Array.from(pathPositionMap.keys());
    return positions.length ? Math.max(...positions) : 0;
  }, [pathPositionMap]);
  const startTeams = useMemo(
    () => teams.filter((t) => t.position <= 0),
    [teams],
  );
  const finishTeams = useMemo(
    () => teams.filter((t) => t.position >= maxPathPosition && maxPathPosition > 0),
    [teams, maxPathPosition],
  );
  const padTeamIds = useMemo(
    () => new Set([...startTeams, ...finishTeams].map((t) => t.id)),
    [startTeams, finishTeams],
  );
  const teamsByCell = useMemo(
    () =>
      buildTeamsByCell(
        teams.filter((t) => !padTeamIds.has(t.id)),
        pathPositionMap,
      ),
    [teams, pathPositionMap, padTeamIds],
  );

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
          <BoardPads
            startPad={start_pad}
            endPad={end_pad}
            startTeams={startTeams}
            finishTeams={finishTeams}
          />
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
                  className="relative min-w-0 min-h-0 overflow-visible"
                >
                  <BoardCell
                    cell={cell}
                    teams={teamsHere}
                    visible={visible}
                    onCellClick={onCellClick}
                    rollingTeamIds={rollingTeamIds}
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
