import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Ticket } from "lucide-react";
import { useBallotTokens } from "@/hooks/useBallotTokens";
import type { BallotTokenTransaction } from "@/types/ballotTokens";

const REASON_LABELS: Record<string, string> = {
  vote_spend: "Vote",
  placement_award: "Placement reward",
  bonus_award: "Performance bonus",
  refund: "Refund",
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

export function BallotTokensCard(): React.JSX.Element | null {
  const { data, isLoading } = useBallotTokens();
  if (isLoading || !data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-rs-bold text-xl text-primary">
          <Ticket className="h-5 w-5" /> Ballot Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-3xl font-rs-bold text-primary">{data.balance}</span>
          <span className="ml-2 text-sm text-muted-foreground">tokens available</span>
        </div>

        {data.transactions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              {data.transactions.slice(0, 8).map((tx: BallotTokenTransaction) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {reasonLabel(tx.reason)}
                  </span>
                  <span
                    className={
                      tx.delta >= 0
                        ? "font-medium text-green-500"
                        : "font-medium text-muted-foreground"
                    }
                  >
                    {tx.delta >= 0 ? `+${tx.delta}` : tx.delta}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
