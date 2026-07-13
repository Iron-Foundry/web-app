import type { BoardPad } from "@/types/tilerace";

interface BoardPadsProps {
  startPad: BoardPad | null;
  endPad: BoardPad | null;
}

interface PadProps {
  pad: BoardPad;
  label: string;
  className: string;
}

function Pad({ pad, label, className }: PadProps): JSX.Element {
  return (
    <div
      style={{
        gridColumn: `${pad.cell_x + 1} / span ${pad.width}`,
        gridRow: `${pad.cell_y + 1} / span ${pad.height}`,
      }}
      className={`pointer-events-none z-10 flex items-center justify-center rounded-md border-2 ${className}`}
    >
      <span className="font-rs-bold text-white text-shadow-fog text-xs sm:text-sm uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

export function BoardPads({ startPad, endPad }: BoardPadsProps): JSX.Element {
  return (
    <>
      {startPad && (
        <Pad
          pad={startPad}
          label="Start"
          className="border-green-400/80 bg-green-500/30"
        />
      )}
      {endPad && (
        <Pad
          pad={endPad}
          label="Finish"
          className="border-red-400/80 bg-red-500/30"
        />
      )}
    </>
  );
}
