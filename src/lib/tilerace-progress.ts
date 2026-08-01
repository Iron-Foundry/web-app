import type { BoardCell, TileRaceTeam } from "@/types/tilerace";

export interface ProgressMarker {
  team: TileRaceTeam;
  percent: number;
  offset: number;
  step: number;
  totalSteps: number;
}

const CLUSTER_THRESHOLD_PERCENT = 3;
const MARKER_SPACING_PX = 26;

export function getMaxPathPosition(cells: BoardCell[]): number {
  let max = 0;
  for (const cell of cells) {
    if (cell.path_position !== null && cell.path_position > max) {
      max = cell.path_position;
    }
  }
  return max;
}

/**
 * Places every team on a 0-100 track and nudges overlapping markers apart so
 * teams sharing a step stay individually clickable.
 */
export function buildProgressMarkers(
  cells: BoardCell[],
  teams: TileRaceTeam[],
): ProgressMarker[] {
  const totalSteps = getMaxPathPosition(cells);

  const markers: ProgressMarker[] = teams
    .map((team) => {
      const step = Math.min(Math.max(team.position, 0), totalSteps);
      return {
        team,
        percent: totalSteps > 0 ? (step / totalSteps) * 100 : 0,
        offset: 0,
        step,
        totalSteps,
      };
    })
    .sort((a, b) => a.percent - b.percent || a.team.name.localeCompare(b.team.name));

  let clusterStart = 0;
  for (let i = 1; i <= markers.length; i++) {
    const head = markers[clusterStart];
    const current = markers[i];
    const stillClustered =
      head !== undefined &&
      current !== undefined &&
      current.percent - head.percent <= CLUSTER_THRESHOLD_PERCENT;
    if (stillClustered) continue;

    const size = i - clusterStart;
    for (let j = clusterStart; j < i; j++) {
      const marker = markers[j];
      if (marker) {
        marker.offset = (j - clusterStart - (size - 1) / 2) * MARKER_SPACING_PX;
      }
    }
    clusterStart = i;
  }

  return markers;
}
