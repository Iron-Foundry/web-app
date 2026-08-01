import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { BoardProgressBar } from "@/components/tilerace/BoardProgressBar";
import type { BoardCell, TileRaceEvent, TileRaceTeam } from "@/types/tilerace";

function team(name: string, position: number): TileRaceTeam {
  return {
    id: name,
    name,
    slug: name.toLowerCase(),
    icon_type: "item",
    icon_url: "",
    color: "hsl(0,0%,50%)",
    position,
    furthest_position: position,
    discord_role_id: null,
    discord_text_channel_id: null,
    discord_voice_channel_id: null,
    members: [],
  };
}

function event(teams: TileRaceTeam[], cells: BoardCell[]): TileRaceEvent {
  return {
    id: "evt",
    name: "Tile Race",
    is_active: true,
    signups_open: false,
    fog_of_war: false,
    grid_cols: 5,
    grid_rows: 5,
    dice_count: 1,
    dice_sides: 6,
    team_size: 4,
    is_finished: false,
    rolls_paused: false,
    winner_team_id: null,
    discord_provisioned: false,
    discord_category_id: null,
    discord_captains_role_id: null,
    discord_captains_channel_id: null,
    discord_permissions: {
      pin_messages: false,
      manage_messages: false,
      mention_everyone: false,
      manage_threads: false,
      manage_channel: false,
      voice_moderation: false,
    },
    start_pad: null,
    end_pad: null,
    background_asset_id: null,
    starts_at: null,
    ends_at: null,
    created_at: "2026-08-01T00:00:00Z",
    cells,
    teams,
    signups: [],
  };
}

const CELLS: BoardCell[] = [
  { cell_x: 0, cell_y: 0, path_position: 0, tile_id: null },
  { cell_x: 1, cell_y: 0, path_position: 4, tile_id: null },
  { cell_x: 2, cell_y: 0, path_position: 8, tile_id: null },
];

describe("BoardProgressBar", () => {
  test("places one marker per team at its share of the board", () => {
    const { getByLabelText } = render(
      <BoardProgressBar event={event([team("Ardy", 4), team("Varrock", 8)], CELLS)} />,
    );

    expect(getByLabelText("Ardy, 50 percent complete").style.left).toBe("50%");
    expect(getByLabelText("Varrock, 100 percent complete").style.left).toBe("100%");
  });

  test("renders nothing when the event has no teams", () => {
    const { container } = render(<BoardProgressBar event={event([], CELLS)} />);

    expect(container.firstChild).toBeNull();
  });
});
