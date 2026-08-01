import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { usePatchTileraceEvent } from "@/hooks/useTilerace";
import { buildCellMap } from "@/lib/tilerace";
import { getCellPresentation } from "@/lib/tilerace-presentation";
import { TilePicker } from "./TilePicker";
import { CellModifiers } from "./CellModifiers";
import { PadConfig, type PadKind } from "./PadConfig";
import { BoardViewport } from "../board/BoardViewport";
import { BoardPads } from "../board/BoardPads";
import type { BoardCell, CellModifier, TileRaceEvent } from "@/types/tilerace";

interface PathEditorProps {
  event: TileRaceEvent;
}

type DragMode = "add" | "remove" | "select";

function addCell(x: number, y: number, cells: BoardCell[]): BoardCell[] {
  const map = buildCellMap(cells);
  const key = `${x},${y}`;
  if (map.get(key)?.path_position != null) return cells;
  const nextPos = cells.filter((c) => c.path_position != null).length + 1;
  const existing = map.get(key);
  const updated = { cell_x: x, cell_y: y, path_position: nextPos, tile_id: existing?.tile_id ?? null };
  return existing ? cells.map((c) => (c.cell_x === x && c.cell_y === y ? updated : c)) : [...cells, updated];
}

function removeCell(x: number, y: number, cells: BoardCell[]): BoardCell[] {
  const existing = buildCellMap(cells).get(`${x},${y}`);
  if (existing?.path_position == null) return cells;
  const removedPos = existing.path_position;
  return cells.map((c) => {
    if (c.cell_x === x && c.cell_y === y) return { ...c, path_position: null, tile_id: null };
    if (c.path_position != null && c.path_position > removedPos) return { ...c, path_position: c.path_position - 1 };
    return c;
  });
}

function serialize(cells: BoardCell[]) {
  return cells.map(({ cell_x, cell_y, path_position, tile_id, modifiers }) => ({
    cell_x,
    cell_y,
    path_position,
    tile_id,
    modifiers,
  }));
}

export function PathEditor({ event }: PathEditorProps): JSX.Element {
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [dragDraft, setDragDraft] = useState<BoardCell[] | null>(null);
  const [placing, setPlacing] = useState<{ kind: PadKind; width: number; height: number } | null>(null);
  const { mutate: patchEvent, isPending } = usePatchTileraceEvent();

  const isDragging = useRef(false);
  const dragMode = useRef<DragMode>("add");
  const draftRef = useRef<BoardCell[]>([]);

  const displayCells = dragDraft ?? event.cells;
  const cellMap = useMemo(() => buildCellMap(displayCells), [displayCells]);
  const pathLength = displayCells.filter((c) => c.path_position != null).length;

  useEffect(() => {
    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (dragMode.current !== "select") {
        patchEvent({ id: event.id, data: { cells: serialize(draftRef.current) } });
      }
      setDragDraft(null);
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [event.id, patchEvent]);

  function onCellDown(x: number, y: number, e: React.MouseEvent) {
    e.preventDefault();
    if (placing) {
      const pad = { cell_x: x, cell_y: y, width: placing.width, height: placing.height };
      const data = placing.kind === "start" ? { start_pad: pad } : { end_pad: pad };
      patchEvent({ id: event.id, data });
      setPlacing(null);
      return;
    }
    const cell = cellMap.get(`${x},${y}`);
    const onPath = cell?.path_position != null;

    isDragging.current = true;

    if (e.shiftKey) {
      if (!onPath) { isDragging.current = false; return; }
      dragMode.current = "remove";
      const next = removeCell(x, y, event.cells);
      draftRef.current = next;
      setDragDraft([...next]);
      setSelectedCell(null);
    } else if (onPath) {
      dragMode.current = "select";
      const full = event.cells.find((c) => c.cell_x === x && c.cell_y === y) ?? null;
      setSelectedCell(full);
    } else {
      dragMode.current = "add";
      const next = addCell(x, y, event.cells);
      draftRef.current = next;
      setDragDraft([...next]);
      const added = buildCellMap(next).get(`${x},${y}`) ?? null;
      setSelectedCell(added);
    }
  }

  function onCellEnter(x: number, y: number) {
    if (!isDragging.current || dragMode.current === "select") return;
    const onPath = buildCellMap(draftRef.current).get(`${x},${y}`)?.path_position != null;
    let next = draftRef.current;
    if (dragMode.current === "add" && !onPath) next = addCell(x, y, next);
    else if (dragMode.current === "remove" && onPath) next = removeCell(x, y, next);
    else return;
    draftRef.current = next;
    setDragDraft([...next]);
  }

  function clearPath() {
    const cleared = event.cells.map((c) => ({ ...c, path_position: null, tile_id: null }));
    patchEvent({ id: event.id, data: { cells: serialize(cleared) } });
    setSelectedCell(null);
  }

  function assignTile(tileId: string | null) {
    if (!selectedCell) return;
    const newCells = event.cells.map((c) =>
      c.cell_x === selectedCell.cell_x && c.cell_y === selectedCell.cell_y ? { ...c, tile_id: tileId } : c,
    );
    patchEvent({ id: event.id, data: { cells: serialize(newCells) } });
    setSelectedCell((prev) => (prev ? { ...prev, tile_id: tileId } : null));
  }

  function assignModifiers(modifiers: CellModifier[]) {
    if (!selectedCell) return;
    const newCells = event.cells.map((c) =>
      c.cell_x === selectedCell.cell_x && c.cell_y === selectedCell.cell_y
        ? { ...c, modifiers }
        : c,
    );
    patchEvent({ id: event.id, data: { cells: serialize(newCells) } });
    setSelectedCell((prev) => (prev ? { ...prev, modifiers } : null));
  }

  return (
    <div className="space-y-4">
      <PadConfig
        eventId={event.id}
        startPad={event.start_pad}
        endPad={event.end_pad}
        placing={placing?.kind ?? null}
        onPlace={(kind, width, height) => setPlacing({ kind, width, height })}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pathLength} step{pathLength !== 1 ? "s" : ""} - drag to draw, shift+drag to erase
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearPath}
            disabled={isPending || pathLength === 0}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Clear Path
          </Button>
        </div>

        <div className="select-none">
          <BoardViewport backgroundUrl={event.background_url} leftButtonPans={false}>
          <div
            className="absolute inset-0 grid gap-0.5 p-2 sm:p-3"
            style={{
              gridTemplateColumns: `repeat(${event.grid_cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${event.grid_rows}, minmax(0, 1fr))`,
            }}
          >
            <BoardPads startPad={event.start_pad} endPad={event.end_pad} />
            {Array.from({ length: event.grid_rows }, (_, y) =>
              Array.from({ length: event.grid_cols }, (_, x) => {
                const key = `${x},${y}`;
                const cell = cellMap.get(key);
                const onPath = cell?.path_position != null;
                const isSelected = selectedCell?.cell_x === x && selectedCell?.cell_y === y;
                const iconUrl = getCellPresentation(cell).iconUrl;

                return (
                  <div
                    key={key}
                    style={{ gridColumn: x + 1, gridRow: y + 1 }}
                    onMouseDown={(e) => onCellDown(x, y, e)}
                    onMouseEnter={() => onCellEnter(x, y)}
                    className={`relative flex items-center justify-center overflow-hidden min-w-0 min-h-0 rounded-sm cursor-crosshair border transition-colors text-[8px] font-medium ${
                      isSelected
                        ? "bg-primary/50 border-primary"
                        : onPath
                        ? "bg-primary/35 border-primary/70 hover:bg-primary/45"
                        : "bg-black/20 border-white/10 hover:bg-black/30"
                    }`}
                  >
                    {onPath && (
                      <>
                        <span className="absolute top-0 left-0.5 leading-none text-[10px] font-bold text-blue-950 text-shadow-white">
                          {cell?.path_position}
                        </span>
                        {iconUrl && (
                          <img
                            src={iconUrl}
                            alt=""
                            className="h-3 w-3 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              }),
            )}
          </div>
          </BoardViewport>
        </div>
      </div>

      <div className="space-y-2">
        <TilePicker
          selectedPathPosition={selectedCell?.path_position ?? null}
          currentTileId={selectedCell?.tile_id}
          onAssign={assignTile}
        />
        {selectedCell?.path_position != null && (
          <CellModifiers
            modifiers={selectedCell.modifiers ?? []}
            onChange={assignModifiers}
          />
        )}
      </div>
    </div>
  );
}
