import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowRight } from "lucide-react";
import type { NameChange } from "@/types/members";
import { timeAgo } from "./feedHelpers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nameChanges: NameChange[];
}

/** Full name change history sheet. */
export function NameChangesSheet({ open, onOpenChange, nameChanges }: Props): React.ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border">
          <SheetTitle className="font-rs-bold text-2xl text-primary">Name Changes</SheetTitle>
          <p className="text-sm text-muted-foreground">{nameChanges.length} recorded name changes</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {nameChanges.length === 0
            ? <p className="px-6 py-8 text-sm text-muted-foreground">No name changes recorded.</p>
            : (
              <ul className="divide-y divide-border">
                {nameChanges.map((nc, i) => (
                  <li key={i} className="flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                    <span className="w-36 shrink-0 font-medium text-muted-foreground truncate">{nc.old_name}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    <span className="w-36 shrink-0 font-medium text-foreground truncate">{nc.new_name}</span>
                    <span className="w-20 shrink-0 text-xs text-muted-foreground/70 text-right ml-auto">
                      {nc.resolved_at ? timeAgo(nc.resolved_at) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </SheetContent>
    </Sheet>
  );
}
