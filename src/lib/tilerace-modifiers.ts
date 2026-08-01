import { itemIconUrl } from "@/components/runelite/bankTag";
import type { CellModifier } from "@/types/tilerace";

const MODIFIER_META: Record<CellModifier["type"], { label: string; symbol: string }> = {
  snakes_ladders: { label: "Jump", symbol: "S" },
  fog: { label: "Fog", symbol: "F" },
  bonus_penalty: { label: "Bonus", symbol: "B" },
  sabotage: { label: "Sabotage", symbol: "X" },
  trap: { label: "Trap", symbol: "T" },
};

/** Bear trap, drawn from the cache service rather than a third-party host. */
const TRAP_ICON_ITEM_ID = 8144;

export interface ModifierDescription {
  label: string;
  symbol: string;
  summary: string;
  iconUrl?: string;
  params: Array<{ label: string; value: string }>;
}

export function describeModifier(mod: CellModifier): ModifierDescription {
  const meta = MODIFIER_META[mod.type];
  if (mod.type === "snakes_ladders") {
    return {
      ...meta,
      summary:
        "Snakes & Ladders. When a team lands here they are immediately moved to the target tile, forward or backward.",
      params: [{ label: "Target tile", value: `#${mod.target_position}` }],
    };
  }
  if (mod.type === "fog") {
    return {
      ...meta,
      summary:
        "Fog of War. Tiles around this one stay hidden as a '?' until a team gets close enough to reveal them.",
      params: [{ label: "Reveal radius", value: `${mod.radius} tile(s)` }],
    };
  }
  if (mod.type === "trap") {
    return {
      ...meta,
      summary: `Landing here rolls ${mod.dice_count}d${mod.dice_sides} and sends the team back that many tiles. A team springs this trap once - after that it is spent and they roll on as normal.`,
      iconUrl: itemIconUrl(TRAP_ICON_ITEM_ID),
      params: [
        { label: "Trap dice", value: `${mod.dice_count}d${mod.dice_sides}` },
        {
          label: "Sends back",
          value: `${mod.dice_count} - ${mod.dice_count * mod.dice_sides} tile(s)`,
        },
      ],
    };
  }
  if (mod.type === "bonus_penalty") {
    const effects: Record<typeof mod.effect, string> = {
      extra_roll: "Grants the team an extra roll this turn.",
      skip_turn: "Forces the team to skip their next turn.",
      reroll: "Lets the team re-roll their dice immediately.",
    };
    return {
      ...meta,
      summary: `Bonus / Penalty. ${effects[mod.effect]}`,
      params: [{ label: "Effect", value: mod.effect.replace("_", " ") }],
    };
  }
  const actions: Record<typeof mod.action, string> = {
    steal_progress: "Lets the team steal progress from a chosen rival team.",
    block: "Forces a chosen rival team to skip their next turn.",
  };
  return {
    ...meta,
    summary: `Sabotage. ${actions[mod.action]}`,
    params:
      mod.action === "steal_progress"
        ? [{ label: "Steal amount", value: `${mod.amount} step(s)` }]
        : [],
  };
}
