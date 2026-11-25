export interface RailEntry {
  id: string;
  label: string;
  count?: string;
  group: "Items" | "Goals";
}

export function sectionId(label: string): string {
  return `frenzy-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function RailLink({ entry }: { entry: RailEntry }): React.ReactElement {
  return (
    <a href={`#${entry.id}`} className="flex justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
      {entry.label}
      {entry.count && <span className="tabular-nums">{entry.count}</span>}
    </a>
  );
}

/** The section jump list: a sticky rail at lg widths, a scrolling tab row below. */
export function FrenzyTeamRail({ entries }: { entries: RailEntry[] }): React.ReactElement {
  return (
    <>
      <nav aria-label="Team sections" className="hidden lg:block sticky top-4 self-start rounded-xl border bg-card p-2">
        {(["Items", "Goals"] as const).map((group) => (
          <div key={group}>
            <p className="px-2.5 pt-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground">{group}</p>
            {entries.filter((e) => e.group === group).map((e) => <RailLink key={e.id} entry={e} />)}
          </div>
        ))}
      </nav>
      <nav aria-label="Team sections" className="lg:hidden flex overflow-x-auto border-b border-border">
        {entries.map((e) => (
          <a key={e.id} href={`#${e.id}`} className="whitespace-nowrap px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
            {e.label}
          </a>
        ))}
      </nav>
    </>
  );
}
