import type { ComponentType } from "react";
import type { RuneLiteConfig } from "@/types/runeliteConfig";
import { TileMarkerEditorDialog } from "./TileMarkerEditorDialog";
import { TileMarkerPreview } from "./TileMarkerPreview";
import { BossHealthEditorDialog } from "./BossHealthEditorDialog";
import { BossHealthPreview } from "./BossHealthPreview";
import { BankTagEditorDialog } from "./BankTagEditorDialog";
import { BankTagPreview } from "./BankTagPreview";
import { parseBankTag } from "./bankTag";
import { InventorySetupEditorDialog } from "./InventorySetupEditorDialog";
import { InventorySetupPreview } from "./InventorySetupPreview";
import type { InventorySetup } from "@/types/runeliteConfig";

export interface RuneLiteEditorProps {
  open: boolean;
  initial: RuneLiteConfig | null;
  onClose: () => void;
  onSaved: (config: RuneLiteConfig) => void;
}

export interface RuneLitePreviewProps {
  config: RuneLiteConfig;
}

export interface RuneLiteObjectType {
  value: string;
  label: string;
  description: string;
  editor: ComponentType<RuneLiteEditorProps>;
  preview: ComponentType<RuneLitePreviewProps>;
  embed: (id: string, glow?: string) => string;
  summary: (config: RuneLiteConfig) => string;
  supportsGlow?: boolean;
}

export const RUNELITE_OBJECT_TYPES: RuneLiteObjectType[] = [
  {
    value: "tile_marker",
    label: "Tile Marker",
    description: "Colored map tiles exported from RuneLite.",
    editor: TileMarkerEditorDialog,
    preview: TileMarkerPreview,
    embed: (id) => `[[tilemarker:${id}]]`,
    summary: (config) => `${config.data.length} tiles`,
  },
  {
    value: "boss_health",
    label: "Boss Health Indicators",
    description: "Boss HP color breakpoints exported from RuneLite.",
    editor: BossHealthEditorDialog,
    preview: BossHealthPreview,
    embed: (id) => `[[bosshealth:${id}]]`,
    summary: (config) => `${config.data.length} bosses`,
  },
  {
    value: "bank_tag",
    label: "Bank Tag Layout",
    description: "Bank tag item layout exported from RuneLite.",
    editor: BankTagEditorDialog,
    preview: BankTagPreview,
    embed: (id, glow) => `[[banktag:${id}${glow ? `|glow=${glow}` : ""}]]`,
    summary: (config) =>
      `${parseBankTag((config.data[0] as string) ?? "")?.slots.length ?? 0} items`,
    supportsGlow: true,
  },
  {
    value: "inventory_setup",
    label: "Inventory Setup",
    description: "Gear, inventory and rune pouch loadout exported from RuneLite.",
    editor: InventorySetupEditorDialog,
    preview: InventorySetupPreview,
    embed: (id, glow) => `[[invsetup:${id}${glow ? `|glow=${glow}` : ""}]]`,
    summary: (config) => {
      const setup = config.data[0] as InventorySetup | undefined;
      const count = setup?.setup.inv?.filter(Boolean).length ?? 0;
      return `${count} items`;
    },
    supportsGlow: true,
  },
];

export function getObjectType(value: string): RuneLiteObjectType | undefined {
  return RUNELITE_OBJECT_TYPES.find((type) => type.value === value);
}

export function objectTypeLabel(value: string): string {
  return getObjectType(value)?.label ?? value;
}

export function objectSummary(config: RuneLiteConfig): string {
  return getObjectType(config.type)?.summary(config) ?? `${config.data.length} objects`;
}
