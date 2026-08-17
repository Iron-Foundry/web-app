import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EventRecap } from "./EventRecap";
import type { TileRaceRecap } from "@/types/tilerace";

interface Props {
  recap: TileRaceRecap;
}

/**
 * The recap folded away under a finished board.
 *
 * Used while another event is running or scheduled: the board is still the
 * thing worth looking at, so the recap waits behind a button.
 */
export function CollapsedRecap({ recap }: Props): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-foreground">Event recap</p>
            <p className="text-xs text-muted-foreground">
              Graphs, final standings and top contributors
            </p>
          </div>
          <Button
            size="sm"
            variant={open ? "outline" : "default"}
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide recap" : "Show recap"}
          </Button>
        </div>
      </Card>
      {open && <EventRecap recap={recap} />}
    </div>
  );
}
