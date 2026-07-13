import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dice6 } from "lucide-react";
import { useRollDice } from "@/hooks/useTilerace";
import type { TileRaceTeam } from "@/types/tilerace";

interface DiceRollerProps {
  eventId: string;
  team: TileRaceTeam;
  currentUserId: string;
  diceCount: number;
  diceSides: number;
  gated?: boolean;
  finished?: boolean;
}

export function DiceRoller({
  eventId,
  team,
  currentUserId,
  diceCount,
  diceSides,
  gated = false,
  finished = false,
}: DiceRollerProps): JSX.Element | null {
  const captain = team.members.find((m) => m.is_captain);
  const isCaptain = captain?.discord_user_id === currentUserId;

  const { mutate: rollDice, isPending } = useRollDice();
  const [displayFace, setDisplayFace] = useState<string>("?");
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const blocked = gated || finished;

  function handleRoll() {
    if (rolling || isPending || blocked) return;
    setRolling(true);
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      setDisplayFace(String(Math.floor(Math.random() * diceSides) + 1));
      ticks++;
      if (ticks >= 12) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRolling(false);
        rollDice(
          { eventId, teamId: team.id },
          {
            onSuccess: (result) => {
              if (result.skipped) setDisplayFace("skip");
              else setDisplayFace(String(result.roll ?? "?"));
            },
          },
        );
      }
    }, 80);
  }

  if (!isCaptain) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="h-9 min-w-9 px-1 rounded border-2 flex items-center justify-center font-rs-bold text-lg transition-all"
        style={{ borderColor: team.color }}
      >
        {displayFace}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRoll}
        disabled={rolling || isPending || blocked}
        title={
          finished
            ? "Game over"
            : gated
            ? "Complete the current tile first"
            : undefined
        }
        className="gap-1.5"
      >
        <Dice6 className="h-3.5 w-3.5" />
        Roll {diceCount}d{diceSides}
      </Button>
    </div>
  );
}
