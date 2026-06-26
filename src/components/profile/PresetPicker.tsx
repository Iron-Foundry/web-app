import { type PresetGoal, SKILL_PRESETS, BOSS_PRESETS, CLUE_PRESETS, CLAN_PRESETS, getSnapshotCurrent, getClanCurrent } from "./presets";
import type { AccountRanking, PlayerSnapshot } from "@/types/members";

function fmtValue(v: number, unit: string): string {
  if (unit === "xp") {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M xp`;
    if (v >= 1_000)     return `${Math.round(v / 1_000)}K xp`;
    return `${v.toLocaleString()} xp`;
  }
  return `${v.toLocaleString()} ${unit}`;
}

function PresetButton({ preset, current, onSelect }: {
  preset: PresetGoal;
  current: number | null;
  onSelect: (preset: PresetGoal) => void;
}): React.JSX.Element {
  return (
    <button
      onClick={() => onSelect(preset)}
      className="flex flex-col gap-1 rounded-md border border-border p-2.5 text-left transition-colors hover:bg-muted/50 w-full"
    >
      <span className="text-xs font-medium leading-tight text-foreground">{preset.title}</span>
      {current != null && current > 0 && (
        <span className="text-[10px] text-muted-foreground">{fmtValue(current, preset.unit)}</span>
      )}
    </button>
  );
}

function WomPresetSection({ label, presets, snapshot, onSelect }: {
  label: string;
  presets: PresetGoal[];
  snapshot: PlayerSnapshot | undefined;
  onSelect: (preset: PresetGoal) => void;
}): React.JSX.Element {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-5">
        {presets.map((p) => (
          <PresetButton
            key={p.id}
            preset={p}
            current={snapshot ? getSnapshotCurrent(p, snapshot) : null}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function ClanPresetSection({ presets, rankings, rsn, onSelect }: {
  presets: PresetGoal[];
  rankings: AccountRanking[];
  rsn: string;
  onSelect: (preset: PresetGoal) => void;
}): React.JSX.Element {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Clan</p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-5">
        {presets.map((p) => (
          <PresetButton
            key={p.id}
            preset={p}
            current={getClanCurrent(p, rankings, rsn)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

/** Grid of preset metrics grouped by Skills, Bosses, Clues, and Clan. Clicking opens goal form pre-filled with metric + current value. */
export function PresetPicker({ snapshot, rankings, rsn, onSelect, onCustom, onCheckbox }: {
  snapshot: PlayerSnapshot | undefined;
  rankings: AccountRanking[];
  rsn: string;
  onSelect: (preset: PresetGoal) => void;
  onCustom: () => void;
  onCheckbox: () => void;
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-4 space-y-4">
      <ClanPresetSection presets={CLAN_PRESETS} rankings={rankings} rsn={rsn} onSelect={onSelect} />
      <WomPresetSection label="Skills"       presets={SKILL_PRESETS} snapshot={snapshot} onSelect={onSelect} />
      <WomPresetSection label="Bosses"       presets={BOSS_PRESETS}  snapshot={snapshot} onSelect={onSelect} />
      <WomPresetSection label="Clue Scrolls" presets={CLUE_PRESETS}  snapshot={snapshot} onSelect={onSelect} />
      <div className="border-t border-border pt-3 flex gap-4">
        <button onClick={onCustom}   className="text-sm text-primary hover:underline underline-offset-2">+ Progress goal</button>
        <button onClick={onCheckbox} className="text-sm text-primary hover:underline underline-offset-2">+ Text goal</button>
      </div>
    </div>
  );
}
