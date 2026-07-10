import { ItemSlot } from "./ItemSlot";
import type { InventorySetup, RuneLiteItem } from "@/types/runeliteConfig";

const EQUIPMENT_CELLS = [-1, 0, -1, 1, 2, 13, 3, 4, 5, -1, 7, -1, 9, 10, 12];
const SPELLBOOKS = ["Standard", "Ancient", "Lunar", "Arceuus"];
const SPELLBOOK_FILES = [
  "Standard_spellbook",
  "Ancient_spellbook",
  "Lunar_spellbook",
  "Arceuus_spellbook",
];

function spellbookIconUrl(sb: number): string {
  return `https://oldschool.runescape.wiki/images/${SPELLBOOK_FILES[sb] ?? ""}.png`;
}

function SpellbookTile({ sb, name }: { sb: number; name: string }) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-sm border border-border/60 bg-background/60">
      <img
        src={spellbookIconUrl(sb)}
        alt={name}
        title={name}
        loading="lazy"
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-center text-xs font-rs-bold uppercase tracking-wide text-primary">{label}</p>
      {children}
    </div>
  );
}

function EquipmentGrid({ eq }: { eq: (RuneLiteItem | null)[] }) {
  return (
    <div className="grid w-full grid-cols-3 gap-0.5">
      {EQUIPMENT_CELLS.map((slot, index) =>
        slot === -1 ? (
          <ItemSlot key={index} empty />
        ) : (
          <ItemSlot key={index} itemId={eq[slot]?.id} />
        ),
      )}
    </div>
  );
}

function ItemGrid({ items, columns }: { items: (RuneLiteItem | null)[]; columns: string }) {
  return (
    <div className={`grid ${columns} w-full gap-0.5`}>
      {items.map((item, index) => (
        <ItemSlot key={index} itemId={item?.id} quantity={item?.q} />
      ))}
    </div>
  );
}

export function InventorySetupDisplay({ setup }: { setup: InventorySetup }) {
  const s = setup.setup;
  const inv = s.inv ?? [];
  const eq = s.eq ?? [];
  const rp = s.rp ?? [];
  const additional = s.afi ? Object.values(s.afi) : [];
  const spellbook = s.sb != null ? SPELLBOOKS[s.sb] : undefined;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="min-w-0 flex-[3] space-y-2">
          <Section label="Equipment">
            <EquipmentGrid eq={eq} />
          </Section>
          {(rp.some(Boolean) || spellbook) && (
            <div className="flex gap-0.5">
              {rp.some(Boolean) && (
                <div className="w-2/3">
                  <Section label="Rune pouch">
                    <ItemGrid items={rp} columns="grid-cols-2" />
                  </Section>
                </div>
              )}
              {spellbook && s.sb != null && (
                <div className="w-1/3">
                  <Section label="Spellbook">
                    <SpellbookTile sb={s.sb} name={spellbook} />
                  </Section>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-[4]">
          <Section label="Inventory">
            <ItemGrid items={inv} columns="grid-cols-4" />
          </Section>
        </div>
      </div>

      {additional.length > 0 && (
        <Section label="Additional items">
          <div className="flex flex-wrap justify-center">
            {additional.map((item, index) => (
              <div key={index} className="w-[12.5%] p-px">
                <ItemSlot itemId={item?.id} quantity={item?.q} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {s.notes && (
        <Section label="Notes">
          <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2 text-xs text-foreground">
            {s.notes}
          </p>
        </Section>
      )}
    </div>
  );
}
