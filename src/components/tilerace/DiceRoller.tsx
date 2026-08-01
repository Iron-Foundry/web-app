import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dice6 } from "lucide-react";
import { useRollDice } from "@/hooks/useTilerace";
import type { TileRaceTeam } from "@/types/tilerace";

const ROLL_DURATION_MS = 10000;
const TICK_MS = 120;

interface DiceRollerProps {
  eventId: string;
  team: TileRaceTeam;
  currentUserId: string;
  diceCount: number;
  diceSides: number;
  gated?: boolean;
  finished?: boolean;
  paused?: boolean;
}

export function DiceRoller({
  eventId,
  team,
  currentUserId,
  diceCount,
  diceSides,
  gated = false,
  finished = false,
  paused = false,
}: DiceRollerProps): JSX.Element | null {
  const isMember = team.members.some((m) => m.discord_user_id === currentUserId);

  const { mutate: rollDice, isPending } = useRollDice();
  const [displayFace, setDisplayFace] = useState<string>("?");
  const [rolling, setRolling] = useState(false);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const blocked = gated || finished || paused;

  function stopSpin(): void {
    if (tickRef.current) clearTimeout(tickRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    setRolling(false);
  }

  function handleRoll(): void {
    if (rolling || isPending || blocked) return;
    setDropMessage(null);
    setRolling(true);
    const spin = (): void => {
      setDisplayFace(String(Math.floor(Math.random() * diceSides) + 1));
      tickRef.current = setTimeout(spin, TICK_MS);
    };
    tickRef.current = setTimeout(spin, TICK_MS);

    rollDice(
      { eventId, teamId: team.id },
      {
        onSuccess: (result) => {
          revealTimeoutRef.current = setTimeout(() => {
            stopSpin();
            if (result.skipped) setDisplayFace("skip");
            else setDisplayFace(String(result.roll ?? "?"));
          }, ROLL_DURATION_MS);
        },
        onError: (error) => {
          stopSpin();
          setDisplayFace("?");
          setDropMessage(
            error instanceof Error
              ? error.message
              : "Someone else already rolled for this team.",
          );
        },
      },
    );
  }

  if (!isMember) return null;

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center gap-2">
        <div
          className={`h-9 min-w-9 px-1 rounded border-2 flex items-center justify-center font-rs-bold text-lg transition-all ${
            rolling ? "animate-pulse" : ""
          }`}
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
              : paused
              ? "Rolling is paused by staff"
              : gated
              ? "Submit proof for the current tile first"
              : undefined
          }
          className="gap-1.5"
        >
          <Dice6 className={`h-3.5 w-3.5 ${rolling ? "animate-spin" : ""}`} />
          Roll {diceCount}d{diceSides}
        </Button>
      </div>
      {dropMessage && <p className="text-xs text-muted-foreground">{dropMessage}</p>}
    </div>
  );
}
