import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePatchTileraceEvent } from "@/hooks/useTilerace";
import type { TileRaceEvent } from "@/types/tilerace";

const MIN_COUNT = 1;
const MAX_COUNT = 5;
const MIN_SIDES = 1;
const MAX_SIDES = 20;

function clamp(value: string, low: number, high: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(high, Math.max(low, Math.trunc(parsed)));
}

interface Props {
  event: TileRaceEvent;
}

/**
 * Dice count and sides, committed by an explicit Save.
 *
 * The inputs are controlled and re-sync to the event whenever it changes, so
 * the box always shows what the server actually holds - the server clamps both
 * values, and an uncontrolled field would keep displaying a rejected number.
 */
export function DiceSettingsCard({ event }: Props): JSX.Element {
  const { mutate: patchEvent, isPending } = usePatchTileraceEvent();
  const [count, setCount] = useState(String(event.dice_count));
  const [sides, setSides] = useState(String(event.dice_sides));

  useEffect(() => {
    setCount(String(event.dice_count));
    setSides(String(event.dice_sides));
  }, [event.dice_count, event.dice_sides]);

  const nextCount = clamp(count, MIN_COUNT, MAX_COUNT, event.dice_count);
  const nextSides = clamp(sides, MIN_SIDES, MAX_SIDES, event.dice_sides);
  const dirty = nextCount !== event.dice_count || nextSides !== event.dice_sides;

  function save(): void {
    if (!dirty) return;
    setCount(String(nextCount));
    setSides(String(nextSides));
    patchEvent({
      id: event.id,
      data: { dice_count: nextCount, dice_sides: nextSides },
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">Dice</p>
        <p className="text-xs text-muted-foreground">
          How many dice a roll uses ({MIN_COUNT}-{MAX_COUNT}) and how many sides
          each die has ({MIN_SIDES}-{MAX_SIDES}). Teams roll {event.dice_count}d
          {event.dice_sides} right now.
        </p>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="dice-count">
              Dice
            </Label>
            <Input
              id="dice-count"
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={count}
              disabled={isPending}
              className="h-8 w-20 text-sm"
              onChange={(e) => setCount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="dice-sides">
              Sides
            </Label>
            <Input
              id="dice-sides"
              type="number"
              min={MIN_SIDES}
              max={MAX_SIDES}
              value={sides}
              disabled={isPending}
              className="h-8 w-20 text-sm"
              onChange={(e) => setSides(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <Button size="sm" onClick={save} disabled={!dirty || isPending}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
