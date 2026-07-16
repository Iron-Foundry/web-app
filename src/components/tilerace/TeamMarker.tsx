import type { TileRaceTeam } from "@/types/tilerace";

interface TeamMarkerProps {
  team: TileRaceTeam;
  index: number;
  total: number;
  isRolling?: boolean;
}

export function TeamMarker({
  team,
  index,
  total,
  isRolling = false,
}: TeamMarkerProps): JSX.Element {
  const offset = total > 1 ? (index - (total - 1) / 2) * 12 : 0;

  return (
    <div
      className={`absolute w-3.5 h-3.5 rounded-full border border-white shadow flex items-center justify-center overflow-hidden cursor-default z-10 ${
        isRolling ? "animate-bounce ring-2 ring-primary ring-offset-1" : ""
      }`}
      style={{
        backgroundColor: team.color,
        transform: `translateX(calc(-50% + ${offset}px))`,
        left: "50%",
      }}
    >
      {team.icon_url ? (
        <img
          src={team.icon_url}
          alt={team.name}
          className="w-2.5 h-2.5 object-contain"
        />
      ) : (
        <span className="text-white text-[7px] font-bold leading-none">
          {team.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
