import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUpdateNotificationPreferences } from "@/hooks/useParties";
import { cn } from "@/lib/utils";
import type { NotificationCategory } from "@/types/parties";

interface Props {
  categories: NotificationCategory[];
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}

/** The party categories a member gets a Discord DM for, one switch each. */
export function NotificationsModal({ categories, selected, onToggle, onClose }: Props): React.ReactElement {
  const updatePrefs = useUpdateNotificationPreferences();
  const [saved, setSaved] = useState(false);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Party Notifications</DialogTitle>
          <DialogDescription>Receive a Discord DM when a party matching your selected categories is created.</DialogDescription>
        </DialogHeader>
        {categories.length === 0 && <p className="text-sm text-muted-foreground">No notification categories configured.</p>}
        <div className="divide-y divide-border">
          {categories.map((c) => {
            const on = selected.includes(c.id);
            return (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm">{c.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={c.label}
                  onClick={() => { onToggle(c.id); setSaved(false); }}
                  className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", on ? "bg-primary" : "bg-muted ring-1 ring-border")}
                >
                  <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full shadow transition-transform motion-reduce:transition-none", on ? "translate-x-5 bg-background" : "translate-x-0 bg-muted-foreground")} />
                </button>
              </div>
            );
          })}
        </div>
        {saved && <p className="text-sm text-mk-green">Saved.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={() => updatePrefs.mutate({ category_ids: selected }, { onSuccess: () => setSaved(true) })} disabled={updatePrefs.isPending || categories.length === 0}>
            {updatePrefs.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
