import { Plus, Target, RefreshCw, Share2, Check } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LinkedAccount } from "@/api/accounts";
import { AccountSwitch } from "./AccountSwitch";

interface Props {
  year: number;
  accounts: LinkedAccount[];
  selectedRsn: string;
  onSelectRsn: (rsn: string) => void;
  copied: boolean;
  canShare: boolean;
  onShare: () => void;
  showAdd: boolean;
  onAdd: () => void;
  fetchedAt: string | null | undefined;
}

/** The goals card title, its Share and Add goal actions, the account switch and the WOM date. */
export function GoalsCardHead(p: Props): React.ReactElement {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="font-rs-bold text-xl text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {p.year} Goals
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {p.selectedRsn && (
            <Button size="sm" variant="ghost" onClick={p.onShare} disabled={!p.canShare} className="text-muted-foreground">
              {p.copied ? <Check className="h-3.5 w-3.5 mr-1 text-mk-green" /> : <Share2 className="h-3.5 w-3.5 mr-1" />}
              {p.copied ? "Copied!" : "Share"}
            </Button>
          )}
          {p.showAdd && (
            <Button size="sm" variant="outline" onClick={p.onAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add goal
            </Button>
          )}
        </div>
      </div>
      <AccountSwitch accounts={p.accounts} selected={p.selectedRsn} onSelect={p.onSelectRsn} />
      {p.fetchedAt && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <RefreshCw className="h-3 w-3" />
          WOM data from {new Date(p.fetchedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
        </p>
      )}
    </CardHeader>
  );
}
