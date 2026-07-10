import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dice6 } from "lucide-react";
import { useRollDice } from "@/hooks/useTilerace";
import type { TileRaceTeam } from "@/types/tilerace";

const DICE_FACES = ["1", "2", "3", "4", "5", "6"] as const;

interface DiceRollerProps {
  eventId: string;
  team: TileRaceTeam;
  currentUserId: string;
}

export function DiceRoller({ eventId, team, currentUserId }: DiceRollerProps): JSX.Element | null {
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

  function handleRoll() {
    if (rolling || isPending) return;
    const result = Math.floor(Math.random() * 6) + 1;
    setRolling(true);

    let ticks = 0;
    intervalRef.current = setInterval(() => {
      const face = DICE_FACES[Math.floor(Math.random() * 6)];
      setDisplayFace(face ?? "?");
      ticks++;
      if (ticks >= 12) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayFace(String(result));
        setRolling(false);
        rollDice({ eventId, teamId: team.id, roll: result });
      }
    }, 80);
  }

  if (!isCaptain) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="h-9 w-9 rounded border-2 flex items-center justify-center font-rs-bold text-lg transition-all"
        style={{ borderColor: team.color }}
      >
        {displayFace}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRoll}
        disabled={rolling || isPending}
        className="gap-1.5"
      >
        <Dice6 className="h-3.5 w-3.5" />
        Roll
      </Button>
    </div>
  );
}
