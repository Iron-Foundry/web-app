import { API_URL } from "@/context/AuthContext";

export const BANK_TAG_COLUMNS = 8;

export interface BankTagSlot {
  position: number;
  itemId: number;
}

export interface BankTagLayout {
  name: string;
  icon: number;
  version: string;
  slots: BankTagSlot[];
}

export function parseBankTag(raw: string): BankTagLayout | null {
  const parts = raw.trim().split(",");
  if (parts[0] !== "banktags") return null;
  const layoutIndex = parts.indexOf("layout");
  if (layoutIndex === -1) return null;
  const slots: BankTagSlot[] = [];
  for (let i = layoutIndex + 1; i + 1 < parts.length; i += 2) {
    const position = Number(parts[i]);
    const itemId = Number(parts[i + 1]);
    if (Number.isFinite(position) && Number.isFinite(itemId)) {
      slots.push({ position, itemId });
    }
  }
  return {
    version: parts[1] ?? "",
    name: parts[2] ?? "",
    icon: Number(parts[3] ?? 0),
    slots,
  };
}

export function itemIconUrl(itemId: number): string {
  return `${API_URL}/osrs-cache/item-icons/${itemId}`;
}
