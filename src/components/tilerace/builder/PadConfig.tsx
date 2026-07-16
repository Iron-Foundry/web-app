import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CellModifiers } from "./CellModifiers";
import { usePatchTileraceEvent } from "@/hooks/useTilerace";
import type { BoardPad, CellModifier } from "@/types/tilerace";

export type PadKind = "start" | "end";

interface PadConfigProps {
  eventId: string;
  startPad: BoardPad | null;
  endPad: BoardPad | null;
  placing: PadKind | null;
  onPlace: (kind: PadKind, width: number, height: number) => void;
}

interface PadRowProps {
  kind: PadKind;
  label: string;
  triggerLabel: string;
  pad: BoardPad | null;
  active: boolean;
  onPlace: (kind: PadKind, width: number, height: number) => void;
  onClear: (kind: PadKind) => void;
  onTrigger: (kind: PadKind, trigger: CellModifier | null) => void;
  onEndsGameChange?: (endsGame: boolean) => void;
}

function PadRow({
  kind,
  label,
  triggerLabel,
  pad,
  active,
  onPlace,
  onClear,
  onTrigger,
  onEndsGameChange,
}: PadRowProps): JSX.Element {
  const [width, setWidth] = useState(String(pad?.width ?? 2));
  const [height, setHeight] = useState(String(pad?.height ?? 2));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-end gap-2">
        <Input
          type="number"
          min={1}
          max={50}
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          className="h-8 w-16 text-sm"
          placeholder="W"
        />
        <Input
          type="number"
          min={1}
          max={50}
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="h-8 w-16 text-sm"
          placeholder="H"
        />
        <Button
          size="sm"
          variant={active ? "default" : "outline"}
          onClick={() =>
            onPlace(kind, Math.max(1, Number(width)), Math.max(1, Number(height)))
          }
        >
          {active ? "Click a tile..." : pad ? "Move" : "Place"}
        </Button>
        {pad && (
          <Button size="sm" variant="ghost" onClick={() => onClear(kind)}>
            Clear
          </Button>
        )}
      </div>
      {pad && onEndsGameChange && (
        <div className="flex items-center justify-between rounded-md border border-border/60 p-2">
          <span className="text-xs">Ends the game on landing</span>
          <Button
            size="sm"
            variant={pad.ends_game !== false ? "default" : "outline"}
            className="h-6 px-2 text-[11px]"
            onClick={() => onEndsGameChange(pad.ends_game === false)}
          >
            {pad.ends_game !== false ? "On" : "Off"}
          </Button>
        </div>
      )}
      {pad && (
        <div>
          <p className="text-[10px] text-muted-foreground">{triggerLabel}</p>
          <CellModifiers
            modifiers={pad.trigger ? [pad.trigger] : []}
            onChange={(mods) => onTrigger(kind, mods.at(-1) ?? null)}
          />
        </div>
      )}
    </div>
  );
}

export function PadConfig({
  eventId,
  startPad,
  endPad,
  placing,
  onPlace,
}: PadConfigProps): JSX.Element {
  const { mutate: patchEvent } = usePatchTileraceEvent();

  function clear(kind: PadKind): void {
    patchEvent({
      id: eventId,
      data: kind === "start" ? { start_pad: null } : { end_pad: null },
    });
  }

  function setTrigger(kind: PadKind, trigger: CellModifier | null): void {
    const pad = kind === "start" ? startPad : endPad;
    if (!pad) return;
    const next = { ...pad, trigger };
    patchEvent({
      id: eventId,
      data: kind === "start" ? { start_pad: next } : { end_pad: next },
    });
  }

  function setEndsGame(endsGame: boolean): void {
    if (!endPad) return;
    const next = { ...endPad, ends_game: endsGame };
    patchEvent({ id: eventId, data: { end_pad: next } });
  }

  return (
    <div className="space-y-3 rounded-md border border-border/60 p-3">
      <p className="text-sm font-semibold">Start / Finish Pads</p>
      <PadRow
        kind="start"
        label="Start pad (width x height)"
        triggerLabel="Optional trigger when a team lands here"
        pad={startPad}
        active={placing === "start"}
        onPlace={onPlace}
        onClear={clear}
        onTrigger={setTrigger}
      />
      <PadRow
        kind="end"
        label="Finish pad (width x height)"
        triggerLabel="Optional trigger when a team lands here"
        pad={endPad}
        active={placing === "end"}
        onPlace={onPlace}
        onClear={clear}
        onTrigger={setTrigger}
        onEndsGameChange={setEndsGame}
      />
    </div>
  );
}
