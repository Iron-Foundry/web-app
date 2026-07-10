import type { TileRaceTeam } from "@/types/tilerace";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamMarkerProps {
  team: TileRaceTeam;
  index: number;
  total: number;
}

export function TeamMarker({ team, index, total }: TeamMarkerProps): JSX.Element {
  const offset = total > 1 ? (index - (total - 1) / 2) * 22 : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute top-1/2 w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-default transition-transform hover:scale-110 z-10"
          style={{
            backgroundColor: team.color,
            transform: `translate(calc(-50% + ${offset}px), -50%)`,
            left: "50%",
          }}
        >
          {team.icon_url ? (
            <img
              src={team.icon_url}
              alt={team.name}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <span className="text-white text-xs font-bold">
              {team.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{team.name}</p>
        <p className="text-xs text-muted-foreground">Step {team.position}</p>
      </TooltipContent>
    </Tooltip>
  );
}
