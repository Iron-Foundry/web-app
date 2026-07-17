import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/badges/colorPicker";

type GradientMode = "solid" | "2" | "3";

interface ParsedGradient {
  mode: GradientMode;
  angle: number;
  stops: string[];
}

const GRADIENT_RE =
  /^linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*(?:,\s*([^,]+?)\s*)?\)$/i;

const MODE_STOPS: Record<GradientMode, number> = { solid: 1, "2": 2, "3": 3 };

function parseGradient(css: string): ParsedGradient {
  const match = GRADIENT_RE.exec(css.trim());
  if (!match) return { mode: "solid", angle: 135, stops: [css.trim() || "#6366f1"] };
  const [, angle, c1, c2, c3] = match;
  const stops: string[] = c3 ? [c1 as string, c2 as string, c3] : [c1 as string, c2 as string];
  return { mode: stops.length === 3 ? "3" : "2", angle: Number(angle), stops };
}

function buildCss({ mode, angle, stops }: ParsedGradient): string {
  if (mode === "solid") return stops[0] ?? "#6366f1";
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

interface GradientBuilderProps {
  initialValue: string;
  onChange: (css: string) => void;
}

export function GradientBuilder({ initialValue, onChange }: GradientBuilderProps): React.JSX.Element {
  const [state, setState] = useState<ParsedGradient>(() => parseGradient(initialValue));

  function update(next: ParsedGradient): void {
    setState(next);
    onChange(buildCss(next));
  }

  function setMode(mode: GradientMode): void {
    const count = MODE_STOPS[mode];
    const fallback = state.stops[state.stops.length - 1] ?? "#6366f1";
    const stops = Array.from({ length: count }, (_, i) => state.stops[i] ?? fallback);
    update({ ...state, mode, stops });
  }

  function setStop(index: number, color: string): void {
    update({ ...state, stops: state.stops.with(index, color) });
  }

  function setAngle(angle: number): void {
    update({ ...state, angle });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {(["solid", "2", "3"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={state.mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
          >
            {m === "solid" ? "Solid" : `${m} colors`}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {state.stops.map((color, i) => (
          <ColorPicker key={i} value={color} onChange={(c) => setStop(i, c)} label={`Stop ${i + 1}`} />
        ))}
      </div>

      {state.mode !== "solid" && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Angle</label>
          <input
            type="range"
            min={0}
            max={360}
            value={state.angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="w-10 text-right text-xs font-mono text-muted-foreground">{state.angle}°</span>
        </div>
      )}
    </div>
  );
}
