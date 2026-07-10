# Tile Race Module

Web-app implementation of the Tile Race event type. Teams progress across a custom tile path on a grid board by rolling dice. Staff builds events using tiles from the shared Bingo Repository.

## Routes

| Path | File | Access |
|---|---|---|
| `/activities/tilerace` | `src/routes/activities/tilerace.tsx` | Public (read open) |
| `/members/config/tilerace` | `src/routes/members/config/tilerace.tsx` | Staff - `tilerace.admin` |
| `/members/config/tile-repository` | `src/routes/members/config/tile-repository.tsx` | Staff - `staff.tile-repository` |

## Permission IDs

| ID | Route | Default roles |
|---|---|---|
| `tilerace` | /activities/tilerace | read: open; edit/create/delete: Foundry Mentors |
| `tilerace.admin` | /members/config/tilerace | read/create/edit: Foundry Mentors; delete: Senior Moderator |
| `staff.tile-repository` | /members/config/tile-repository | read/create/edit/delete: Foundry Mentors |

## Type Reference (`src/types/tilerace.ts`)

**`RepositoryTile`** - A tile in the shared repository.
- `id: string`
- `title: string`
- `description: string`
- `icon_url: string | null` - manual icon override; null = derive from first item
- `icon_source: "wiki" | "asset" | "external"`
- `items: TileItem[]` - OSRS items required; each has `item_id, name, quantity, icon_url`
- `tags: TileTag[]` - see `TileTag` union below

**`TileTag`** - `"precheck" | "pvm" | "skilling" | "minigames" | "misc" | "endgame" | "midgame" | "earlygame"`

**`BoardCell`** - A cell in the event grid.
- `cell_x: number` - 0-indexed column
- `cell_y: number` - 0-indexed row
- `path_position: number | null` - step number on path (1-indexed); null = not on path
- `tile_id: string | null` - assigned tile from repository
- `tile?: RepositoryTile` - embedded by API in public responses

**`TileRaceEvent`** - Full event detail.
- Extends `TileRaceEventSummary`
- `cells: BoardCell[]` - all cells with path info
- `teams: TileRaceTeam[]`
- `signups: TileRaceSignup[]` - members who signed up but are not yet on a team

**`TileRaceTeam`**
- `id, name, slug: string`
- `icon_type: "npc" | "item"` - what the team chose as their marker
- `icon_url: string` - wiki image
- `color: string` - CSS hex/hsl for marker and accent
- `position: number` - current path step (0 = start, before step 1)
- `members: TileRaceParticipant[]`

**`TileRaceParticipant`**
- `discord_user_id, rsn: string`
- `ranking_score: number`
- `is_captain: boolean` - only captains can trigger dice rolls

## API Endpoints (`src/api/tilerace.ts`)

Base prefix: `/tilerace/`

| Group | Endpoint | Method |
|---|---|---|
| Public | `/tilerace/active` | GET |
| Public | `/tilerace/events/:id` | GET |
| Signup | `/tilerace/events/:id/signup` | POST / DELETE |
| Repository | `/tilerace/repository` | GET / POST |
| Repository | `/tilerace/repository/:id` | GET / PATCH / DELETE |
| Events | `/tilerace/events` | GET / POST |
| Events | `/tilerace/events/:id` | PATCH / DELETE |
| Events | `/tilerace/events/:id/activate` | POST |
| Events | `/tilerace/events/:id/deactivate` | POST |
| Teams | `/tilerace/events/:id/teams` | POST |
| Teams | `/tilerace/events/:id/teams/:teamId` | PATCH / DELETE |
| Teams | `/tilerace/events/:id/teams/scramble` | POST |
| Controls | `/tilerace/events/:id/teams/:teamId/roll` | POST `{ roll: 1-6 }` |
| Controls | `/tilerace/events/:id/fog-of-war` | PATCH `{ enabled: bool }` |
| OSRS ref | `/frenzy/osrs/items?q=` | GET (reused from frenzy) |
| OSRS ref | `/tilerace/osrs/npcs?q=` | GET |

## Component Tree

```
TileRacePage (/activities/tilerace)
  TileBoard
    BoardCellContent (per cell)
      TeamMarker (per team at cell)
  TeamCard (per team)
    DiceRoller (captain only, per team)

StaffTileracePage (/members/config/tilerace)
  [Events tab]  EventsTab
  [Builder tab] GridConfig + PathEditor
                  TilePicker
                    TileCard (compact, selectable)
  [Teams tab]   TeamManager
  [Controls tab] ControlsTab (fog of war + position overrides)

TileRepositoryPage (/members/config/tile-repository)
  RepositoryList
    TileCard (full, with edit/delete hover actions)
    TileEditor (create/edit form)
      ItemSearch (OSRS item search, reuses /frenzy/osrs/items)
    TileDetail (dialog, click to expand)
```

## Key Patterns

### Path Building
Cells store `path_position: number | null`. Staff clicks cells in the PathEditor to build the ordered path. Removing a cell from the path renumbers all subsequent steps. The API receives the full cell array on each save (`PATCH /tilerace/events/:id` with `cells[]`).

### Fog of War
When `event.fog_of_war === true`, `buildFogMask(teams)` returns `max(team.position)` for all teams. Cells with `path_position > fogMax` are hidden (greyed out, tile icons not shown). Non-path cells are always visible. Staff toggles this globally via the Controls tab.

### Dice Roll Flow
1. Captain sees DiceRoller on their TeamCard
2. Click Roll: client picks random 1-6, animates face cycling
3. On settle: calls `POST /tilerace/events/:id/teams/:teamId/roll` with `{ roll: N }`
4. Server advances team position and returns `{ roll, new_position }`
5. TanStack Query invalidates `tilerace.active` - board re-renders with new marker position

### Team Scramble
`POST /tilerace/events/:id/teams/scramble` - server distributes all `event.signups` across `event.teams` in a balanced way using `ranking_score` for even distribution. Frontend just triggers and invalidates.

### OSRS Icon Resolution
For `RepositoryTile`:
1. If `icon_url` set: use it directly
2. Else: use `tile.items[0].icon_url` (wiki sprite from item search)
3. If no items: render placeholder

`getEffectiveTileIcon(tile)` in `src/lib/tilerace.ts` implements this.

### Background Image
`TileRaceEventSummary.background_url` is set via the AssetPickerDialog in GridConfig. The API may also derive it from `background_asset_id`. The board renders it as a CSS `background-image` on the 18:9 container. Grid cells have semi-transparent backgrounds so the board image shows through.

## Hooks (`src/hooks/useTilerace.ts`)

Stale times: `STALE_5M` (5 min) for live event data, `STALE_24H` (24h) for repository tiles.

Key query keys (from `src/lib/queryKeys.ts`):
- `queryKeys.tilerace.active()` - active event
- `queryKeys.tilerace.events()` - event list
- `queryKeys.tilerace.event(id)` - event detail
- `queryKeys.tilerace.tiles(paramsKey)` - repository tiles
- `queryKeys.tilerace.tile(id)` - single tile

## Lib Utilities (`src/lib/tilerace.ts`)

- `TILE_TAGS: TileTag[]` - all valid tags
- `TEAM_COLORS: string[]` - preset HSL colors (same palette as Frenzy)
- `getPathCells(cells)` - sorted by path_position
- `getTileAtPosition(cells, pos)` - cell at step N
- `buildFogMask(teams)` - max team position for fog logic
- `isCellVisible(cell, maxVisible, fogEnabled)` - fog visibility check
- `getEffectiveTileIcon(tile)` - icon URL resolution
- `buildCellMap(cells)` - Map keyed by "x,y"
- `buildPathPositionMap(cells)` - Map keyed by path_position
- `buildTeamsByCell(teams, pathPositionMap)` - Map of teams per cell key
- `formatTileRaceDate(iso)` - "d Mon YYYY" format
- `slugify(name)` - kebab-case slug
