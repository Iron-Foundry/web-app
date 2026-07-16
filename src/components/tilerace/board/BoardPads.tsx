import type { BoardPad, TileRaceTeam } from "@/types/tilerace";

interface BoardPadsProps {
  startPad: BoardPad | null;
  endPad: BoardPad | null;
  startTeams?: TileRaceTeam[];
  finishTeams?: TileRaceTeam[];
}

interface PadProps {
  pad: BoardPad;
  label: string;
  className: string;
  teams: TileRaceTeam[];
}

function Pad({ pad, label, className, teams }: PadProps): JSX.Element {
  return (
    <div
      style={{
        gridColumn: `${pad.cell_x + 1} / span ${pad.width}`,
        gridRow: `${pad.cell_y + 1} / span ${pad.height}`,
      }}
      className={`pointer-events-none z-10 flex flex-col items-center justify-center gap-1 rounded-md border-2 ${className}`}
    >
      <span className="font-rs-bold text-white text-shadow-fog text-xs sm:text-sm uppercase tracking-wide">
        {label}
      </span>
      {teams.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 px-1">
          {teams.map((team) => (
            <div
              key={team.id}
              title={team.name}
              className="w-4 h-4 rounded-full border border-white shadow flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: team.color }}
            >
              {team.icon_url ? (
                <img
                  src={team.icon_url}
                  alt={team.name}
                  className="w-3 h-3 object-contain"
                />
              ) : (
                <span className="text-white text-[8px] font-bold leading-none">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BoardPads({
  startPad,
  endPad,
  startTeams = [],
  finishTeams = [],
}: BoardPadsProps): JSX.Element {
  return (
    <>
      {startPad && (
        <Pad
          pad={startPad}
          label="Start"
          className="border-green-400/80 bg-green-500/30"
          teams={startTeams}
        />
      )}
      {endPad && (
        <Pad
          pad={endPad}
          label="Finish"
          className="border-red-400/80 bg-red-500/30"
          teams={finishTeams}
        />
      )}
    </>
  );
}
