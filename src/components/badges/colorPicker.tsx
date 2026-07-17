import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function ColorPicker({ value, onChange, label }: ColorPickerProps): React.JSX.Element {
  const [hexInput, setHexInput] = useState(value);

  function commitHex(next: string): void {
    setHexInput(next);
    if (HEX_RE.test(next)) onChange(next);
  }

  return (
    <Popover onOpenChange={(open) => open && setHexInput(value)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ?? "Pick color"}
          className="h-8 w-8 shrink-0 rounded-full border border-border shadow-sm"
          style={{ background: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-3">
        <HexColorPicker
          color={HEX_RE.test(value) ? value : "#6366f1"}
          onChange={onChange}
          className="!w-full"
        />
        <Input
          value={hexInput}
          onChange={(e) => commitHex(e.target.value)}
          placeholder="#rrggbb"
          className="font-mono text-xs"
        />
      </PopoverContent>
    </Popover>
  );
}
